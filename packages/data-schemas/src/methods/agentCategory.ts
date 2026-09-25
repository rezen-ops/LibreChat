import type { Model, Types } from 'mongoose';
import type { IAgentCategory } from '~/types';
import { tenantSafeBulkWrite } from '~/utils/tenantBulkWrite';

export function createAgentCategoryMethods(mongoose: typeof import('mongoose')): {
  getActiveCategories: () => Promise<IAgentCategory[]>;
  getCategoriesWithCounts: () => Promise<(IAgentCategory & { agentCount: number })[]>;
  getValidCategoryValues: () => Promise<string[]>;
  seedCategories: (
    categories: Array<{
      value: string;
      label?: string;
      description?: string;
      order?: number;
      custom?: boolean;
    }>,
  ) => Promise<import('mongoose').mongo.BulkWriteResult>;
  findCategoryByValue: (value: string) => Promise<IAgentCategory | null>;
  createCategory: (categoryData: Partial<IAgentCategory>) => Promise<IAgentCategory>;
  updateCategory: (
    value: string,
    updateData: Partial<IAgentCategory>,
  ) => Promise<IAgentCategory | null>;
  deleteCategory: (value: string) => Promise<boolean>;
  findCategoryById: (id: string | Types.ObjectId) => Promise<IAgentCategory | null>;
  getAllCategories: () => Promise<IAgentCategory[]>;
  ensureDefaultCategories: () => Promise<boolean>;
} {
  /**
   * Get all active categories sorted by order
   * @returns Array of active categories
   */
  async function getActiveCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true })
      .sort({ order: 1, label: 1 })
      .lean<IAgentCategory[]>();
  }

  /**
   * Get categories with agent counts
   * @returns Categories with agent counts
   */
  async function getCategoriesWithCounts(): Promise<(IAgentCategory & { agentCount: number })[]> {
    const Agent = mongoose.models.Agent;

    const categoryCounts = await Agent.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(categoryCounts.map((c) => [c._id, c.count]));
    const categories = await getActiveCategories();

    return categories.map((category) => ({
      ...category,
      agentCount: countMap.get(category.value) || (0 as number),
    })) as (IAgentCategory & { agentCount: number })[];
  }

  /**
   * Get valid category values for Agent model validation
   * @returns Array of valid category values
   */
  async function getValidCategoryValues(): Promise<string[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true }).distinct('value').lean();
  }

  /**
   * Seed initial categories from existing constants
   * @param categories - Array of category data to seed
   * @returns Bulk write result
   */
  async function seedCategories(
    categories: Array<{
      value: string;
      label?: string;
      description?: string;
      order?: number;
      custom?: boolean;
    }>,
  ): Promise<import('mongoose').mongo.BulkWriteResult> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    const operations = categories.map((category, index) => ({
      updateOne: {
        filter: { value: category.value },
        update: {
          $setOnInsert: {
            value: category.value,
            label: category.label || category.value,
            description: category.description || '',
            order: category.order || index,
            isActive: true,
            custom: category.custom || false,
          },
        },
        upsert: true,
      },
    }));

    return await tenantSafeBulkWrite(AgentCategory, operations);
  }

  /**
   * Find a category by value
   * @param value - The category value to search for
   * @returns The category document or null
   */
  async function findCategoryByValue(value: string): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOne({ value }).lean<IAgentCategory>();
  }

  /**
   * Create a new category
   * @param categoryData - The category data to create
   * @returns The created category
   */
  async function createCategory(categoryData: Partial<IAgentCategory>): Promise<IAgentCategory> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const category = await AgentCategory.create(categoryData);
    return category.toObject() as IAgentCategory;
  }

  /**
   * Update a category by value
   * @param value - The category value to update
   * @param updateData - The data to update
   * @returns The updated category or null
   */
  async function updateCategory(
    value: string,
    updateData: Partial<IAgentCategory>,
  ): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOneAndUpdate(
      { value },
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean<IAgentCategory>();
  }

  /**
   * Delete a category by value
   * @param value - The category value to delete
   * @returns Whether the deletion was successful
   */
  async function deleteCategory(value: string): Promise<boolean> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const result = await AgentCategory.deleteOne({ value });
    return result.deletedCount > 0;
  }

  /**
   * Find a category by ID
   * @param id - The category ID to search for
   * @returns The category document or null
   */
  async function findCategoryById(id: string | Types.ObjectId): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findById(id).lean<IAgentCategory>();
  }

  /**
   * Get all categories (active and inactive)
   * @returns Array of all categories
   */
  async function getAllCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({}).sort({ order: 1, label: 1 }).lean<IAgentCategory[]>();
  }

  /**
   * Ensure default categories exist and update them if they don't have localization keys
   * @returns Promise<boolean> - true if categories were created/updated, false if no changes
   */
  async function ensureDefaultCategories(): Promise<boolean> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    /**
     * KMH crews. These replace LibreChat's generic business categories
     * (General, HR, R&D, Finance, IT, Sales, After Sales), which mean nothing
     * here — agents are grouped by the crew that owns the client.
     *
     * `value` is stored on each agent, so renaming a value orphans the agents
     * using it. Rename the `label` from the admin panel instead: an edit there
     * marks the row `custom` and this seed then leaves it alone.
     * `color` must be a key from client/src/components/Kmh/crewColors.ts.
     */
    const CREW_COLORS_BY_INDEX = [
      'teal',
      'amber',
      'violet',
      'rose',
      'blue',
      'green',
      'orange',
      'cyan',
      'fuchsia',
      'slate',
    ];
    const defaultCategories = [
      ...Array.from({ length: 10 }, (_, i) => ({
        value: `kaizen-crew-${i + 1}`,
        label: `Kaizen Crew ${i + 1}`,
        color: CREW_COLORS_BY_INDEX[i],
        order: i,
      })),
      { value: 'unassigned', label: 'Unassigned', color: '', order: 99 },
    ].map((c) => ({ ...c, description: '' }));

    /** KMH: the pilot seeded four placeholder crews (`pod-one`…`pod-four`).
     *  Agents store the category value, so dropping those rows would strand
     *  every agent already filed under one. Carry them across to the crew that
     *  replaced them, once — a value that no longer exists matches nothing on
     *  later boots, which is what makes this safe to leave in place. */
    const RENAMED_CREWS: Record<string, string> = {
      'pod-one': 'kaizen-crew-1',
      'pod-two': 'kaizen-crew-2',
      'pod-three': 'kaizen-crew-3',
      'pod-four': 'kaizen-crew-4',
    };
    const Agent = mongoose.models.Agent;
    if (Agent) {
      for (const [from, to] of Object.entries(RENAMED_CREWS)) {
        await Agent.updateMany({ category: from }, { $set: { category: to } });
      }
    }
    await AgentCategory.deleteMany({ value: { $in: Object.keys(RENAMED_CREWS) } });

    /** KMH: retire LibreChat's generic business categories. Named explicitly
     *  rather than "anything not a crew" — crews created later from the admin
     *  panel are `custom` and must survive every restart. */
    const retiredDefaults = ['general', 'hr', 'rd', 'finance', 'it', 'sales', 'aftersales'];
    await AgentCategory.updateMany(
      { value: { $in: retiredDefaults }, isActive: true, custom: { $ne: true } },
      { $set: { isActive: false } },
    );

    const existingCategories = await getAllCategories();
    const existingCategoryMap = new Map(existingCategories.map((cat) => [cat.value, cat]));

    const updates = [];
    let created = 0;

    for (const defaultCategory of defaultCategories) {
      const existingCategory = existingCategoryMap.get(defaultCategory.value);

      if (existingCategory) {
        const isNotCustom = !existingCategory.custom;
        const needsLocalization = !existingCategory.label.startsWith('com_');

        if (isNotCustom && needsLocalization) {
          updates.push({
            value: defaultCategory.value,
            label: defaultCategory.label,
            description: defaultCategory.description,
          });
        }
      } else {
        await createCategory({
          ...defaultCategory,
          isActive: true,
          custom: false,
        });
        created++;
      }
    }

    if (updates.length > 0) {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { value: update.value, custom: { $ne: true } },
          update: {
            $set: {
              label: update.label,
              description: update.description,
            },
          },
        },
      }));

      await tenantSafeBulkWrite(AgentCategory, bulkOps, { ordered: false });
    }

    return updates.length > 0 || created > 0;
  }

  return {
    getActiveCategories,
    getCategoriesWithCounts,
    getValidCategoryValues,
    seedCategories,
    findCategoryByValue,
    createCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    getAllCategories,
    ensureDefaultCategories,
  };
}

export type AgentCategoryMethods = ReturnType<typeof createAgentCategoryMethods>;
