const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = express.Router();

const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

/**
 * KMH pods.
 *
 * A pod is an agent category with a colour. LibreChat ships categories as a
 * fixed seed with no way to edit them from the UI, which is why pods had to be
 * renamed in code. These routes make them editable so the fleet can be
 * reorganised without a deploy.
 *
 * `value` is what each agent stores, so it is assigned once at creation and
 * never rewritten — renaming a pod changes `label` only, and the agents stay
 * attached. Deleting a pod deactivates it and moves its agents to `unassigned`
 * rather than dropping the field, so no agent ends up in a category the UI
 * cannot show.
 */

/** Must match client/src/components/Kmh/podColors.ts. */
const POD_COLOR_KEYS = new Set(['slate', 'teal', 'amber', 'rose', 'violet', 'green', 'blue']);

/** Out-of-palette colours are stored empty rather than rejected, so a stale
 *  client can never fail a save over a colour it doesn't know about. */
const sanitizeColor = (value) => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return POD_COLOR_KEYS.has(v) ? v : '';
};

/** Reserved values: `all` is the marketplace's synthetic "everything" tab and
 *  `promoted` is injected from the agent flag, so neither may be a pod. */
const RESERVED_VALUES = new Set(['all', 'promoted']);

const MAX_LABEL_LENGTH = 40;

const sanitizeLabel = (value) =>
  typeof value === 'string' ? value.trim().slice(0, MAX_LABEL_LENGTH) : '';

/** Derive a stable url-safe `value` from the label the admin typed. */
const slugify = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const Agent = () => mongoose.models.Agent;

/** Agent counts per category, including categories with none. */
async function countsByCategory() {
  const rows = await Agent().aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [r._id ?? '', r.count]));
}

const shape = (pod, counts) => ({
  value: pod.value,
  label: pod.label,
  color: pod.color ?? '',
  order: pod.order ?? 0,
  isActive: pod.isActive !== false,
  agentCount: counts.get(pod.value) ?? 0,
});

router.use(requireJwtAuth, requireAdminAccess);

/** Every pod, active or not — the admin view needs to show retired ones. */
router.get('/', async (_req, res) => {
  try {
    const [pods, counts] = await Promise.all([db.getAllCategories(), countsByCategory()]);
    res.status(200).json(pods.map((pod) => shape(pod, counts)));
  } catch (error) {
    logger.error('[/api/admin/pods] list failed:', error);
    res.status(500).json({ error: 'Failed to list pods' });
  }
});

router.post('/', async (req, res) => {
  try {
    const label = sanitizeLabel(req.body?.label);
    if (!label) {
      return res.status(400).json({ error: 'A pod name is required' });
    }
    const value = slugify(label);
    if (!value || RESERVED_VALUES.has(value)) {
      return res.status(400).json({ error: `"${label}" is not a usable pod name` });
    }
    if (await db.findCategoryByValue(value)) {
      return res.status(409).json({ error: `A pod named "${label}" already exists` });
    }

    const pods = await db.getAllCategories();
    const created = await db.createCategory({
      value,
      label,
      color: sanitizeColor(req.body?.color),
      description: '',
      /** Append: `unassigned` sits at 99 so new pods land above it. */
      order: Math.min(98, pods.length),
      isActive: true,
      custom: true,
    });
    res.status(201).json(shape(created, await countsByCategory()));
  } catch (error) {
    logger.error('[/api/admin/pods] create failed:', error);
    res.status(500).json({ error: 'Failed to create pod' });
  }
});

router.patch('/:value', async (req, res) => {
  try {
    const { value } = req.params;
    const update = {};
    if (req.body?.label !== undefined) {
      const label = sanitizeLabel(req.body.label);
      if (!label) {
        return res.status(400).json({ error: 'A pod name is required' });
      }
      update.label = label;
    }
    if (req.body?.color !== undefined) {
      update.color = sanitizeColor(req.body.color);
    }
    if (req.body?.order !== undefined && Number.isFinite(Number(req.body.order))) {
      update.order = Number(req.body.order);
    }
    if (req.body?.isActive !== undefined) {
      update.isActive = req.body.isActive === true;
    }
    /** `custom` marks a pod as admin-owned, which stops the startup seed from
     *  resetting its label back to the one hard-coded in ensureDefaultCategories. */
    update.custom = true;

    const updated = await db.updateCategory(value, update);
    if (!updated) {
      return res.status(404).json({ error: 'Pod not found' });
    }
    res.status(200).json(shape(updated, await countsByCategory()));
  } catch (error) {
    logger.error('[/api/admin/pods] update failed:', error);
    res.status(500).json({ error: 'Failed to update pod' });
  }
});

/** Deactivate rather than delete, and rehome the agents first. */
router.delete('/:value', async (req, res) => {
  try {
    const { value } = req.params;
    if (value === 'unassigned') {
      return res.status(400).json({ error: 'Unassigned is where retired pods send their agents' });
    }
    const pod = await db.findCategoryByValue(value);
    if (!pod) {
      return res.status(404).json({ error: 'Pod not found' });
    }
    const moved = await Agent().updateMany(
      { category: value },
      { $set: { category: 'unassigned' } },
    );
    await db.updateCategory(value, { isActive: false });
    res.status(200).json({ value, movedAgents: moved.modifiedCount ?? 0 });
  } catch (error) {
    logger.error('[/api/admin/pods] delete failed:', error);
    res.status(500).json({ error: 'Failed to delete pod' });
  }
});

/** The fleet, for the assignment table. Projection only — no instructions or
 *  tool payloads, which run to hundreds of kilobytes across the fleet. */
router.get('/agents', async (_req, res) => {
  try {
    const agents = await Agent()
      .find({}, { id: 1, name: 1, category: 1, provider: 1, model: 1, updatedAt: 1 })
      .sort({ name: 1 })
      .lean();
    res.status(200).json(
      agents.map((a) => ({
        id: a.id,
        name: a.name ?? '',
        category: a.category ?? '',
        provider: a.provider ?? '',
        model: a.model ?? '',
        updatedAt: a.updatedAt,
      })),
    );
  } catch (error) {
    logger.error('[/api/admin/pods] agent list failed:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

/** Bulk-assign: the whole point of the panel — move a batch of agents in one go. */
router.post('/assign', async (req, res) => {
  try {
    const agentIds = Array.isArray(req.body?.agentIds) ? req.body.agentIds : [];
    const pod = typeof req.body?.pod === 'string' ? req.body.pod : '';
    if (agentIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one agent' });
    }
    if (!pod || RESERVED_VALUES.has(pod)) {
      return res.status(400).json({ error: 'Choose a pod to assign to' });
    }
    const target = await db.findCategoryByValue(pod);
    if (!target || target.isActive === false) {
      return res.status(400).json({ error: 'That pod no longer exists' });
    }

    const result = await Agent().updateMany({ id: { $in: agentIds } }, { $set: { category: pod } });
    res.status(200).json({ pod, updated: result.modifiedCount ?? 0 });
  } catch (error) {
    logger.error('[/api/admin/pods] assign failed:', error);
    res.status(500).json({ error: 'Failed to assign agents' });
  }
});

module.exports = router;
