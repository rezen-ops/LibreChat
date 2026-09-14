import { useMemo, useState } from 'react';
import { SystemRoles } from 'librechat-data-provider';
import { Check, Plus, Trash2, Users } from 'lucide-react';
import { Button, Input, useToastContext } from '@librechat/client';
import type { LocalizeFunction } from '~/common';
import {
  usePodsQuery,
  usePodAgentsQuery,
  useCreatePod,
  useUpdatePod,
  useDeletePod,
  useAssignAgents,
  type Pod,
} from './usePods';
import { POD_COLORS, POD_COLOR_KEYS, podColor, type PodColorKey } from './podColors';
import { useAuthContext, useLocalize } from '~/hooks';
import { NotificationSeverity } from '~/common';
import { cn } from '~/utils';

/**
 * KMH admin: pods and fleet assignment.
 *
 * Pods are LibreChat agent categories with a colour. This page exists because
 * upstream seeds categories in code and offers no way to change them — which
 * made reorganising the fleet a deploy. Everything here is a database edit.
 *
 * The bulk-assign table is the load-bearing half: moving twenty agents into a
 * new pod one agent-edit-dialog at a time is the exact chore it replaces.
 */

const agentCountLabel = (count: number, localize: LocalizeFunction) =>
  count === 1
    ? localize('com_kmh_pods_agent_count_one')
    : localize('com_kmh_pods_agent_count', { count });

/** Swatches, small enough to sit inside a table row. */
function ColorRow({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (v: PodColorKey) => void;
}) {
  const current = ((value as PodColorKey) in POD_COLORS ? value : 'none') as PodColorKey;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {POD_COLOR_KEYS.filter((key) => key !== 'none').map((key) => (
        <button
          key={key}
          type="button"
          title={POD_COLORS[key].label}
          aria-label={POD_COLORS[key].label}
          aria-pressed={key === current}
          onClick={() => onChange(key)}
          className={cn(
            'h-5 w-5 rounded-full transition',
            POD_COLORS[key].dot,
            key === current
              ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-surface-primary'
              : 'hover:scale-110',
          )}
        />
      ))}
    </div>
  );
}

function PodDeleteCell({ pod }: { pod: Pod }) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const deletePod = useDeletePod();
  const [confirming, setConfirming] = useState(false);

  /** `unassigned` is where retired pods send their agents, so it cannot go. */
  if (pod.value === 'unassigned') {
    return null;
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-text-secondary"
        onClick={() => setConfirming(true)}
        aria-label={localize('com_kmh_pods_remove', { pod: pod.label })}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-text-secondary">
        {pod.agentCount > 0
          ? localize('com_kmh_pods_remove_confirm_agents', { count: pod.agentCount })
          : localize('com_kmh_pods_remove_confirm')}
      </span>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="h-7"
        disabled={deletePod.isLoading}
        onClick={() =>
          deletePod.mutate(pod.value, {
            onSuccess: (result) => {
              setConfirming(false);
              showToast({
                message: result.movedAgents
                  ? localize('com_kmh_pods_removed_moved', { count: result.movedAgents })
                  : localize('com_kmh_pods_removed'),
              });
            },
            onError: (error: unknown) =>
              showToast({
                message: (error as Error)?.message ?? localize('com_kmh_pods_remove_error'),
                severity: NotificationSeverity.ERROR,
              }),
          })
        }
      >
        {localize('com_kmh_pods_yes')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7"
        onClick={() => setConfirming(false)}
      >
        {localize('com_kmh_pods_no')}
      </Button>
    </div>
  );
}

function PodRow({ pod }: { pod: Pod }) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const updatePod = useUpdatePod();
  const [label, setLabel] = useState(pod.label);

  const dirty = label.trim() !== pod.label && label.trim().length > 0;

  const save = (patch: Partial<Pod>) =>
    updatePod.mutate(
      { value: pod.value, ...patch },
      {
        onError: (error: unknown) =>
          showToast({
            message: (error as Error)?.message ?? localize('com_kmh_pods_save_error'),
            severity: NotificationSeverity.ERROR,
          }),
      },
    );

  return (
    <tr className="border-b border-border-light last:border-b-0">
      <td className="py-3 pr-3 align-middle">
        <div className="flex items-center gap-2">
          <span
            className={cn('h-2.5 w-2.5 shrink-0 rounded-full', podColor(pod.color).dot)}
            aria-hidden="true"
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && dirty) {
                save({ label: label.trim() });
              }
            }}
            className="h-8 max-w-[14rem]"
            aria-label={localize('com_kmh_pods_name_label', { pod: pod.label })}
          />
          {dirty ? (
            <Button
              type="button"
              size="sm"
              variant="submit"
              className="h-8 px-2"
              aria-label={localize('com_kmh_pods_save')}
              onClick={() => save({ label: label.trim() })}
              disabled={updatePod.isLoading}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        {/* The stored key. Shown because a rename never touches it, which is the
            difference between a safe rename and orphaned agents. */}
        <span className="ml-[1.375rem] mt-1 block font-mono text-xs text-text-tertiary">
          {pod.value}
        </span>
      </td>
      <td className="py-3 pr-3 align-middle">
        <ColorRow value={pod.color} onChange={(color) => save({ color })} />
      </td>
      <td className="py-3 pr-3 align-middle text-sm text-text-secondary">
        {agentCountLabel(pod.agentCount, localize)}
      </td>
      <td className="py-3 text-right align-middle">
        <PodDeleteCell pod={pod} />
      </td>
    </tr>
  );
}

function PodsPanel({ pods }: { pods: Pod[] }) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const createPod = useCreatePod();
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<PodColorKey>('teal');

  const add = () => {
    const label = newLabel.trim();
    if (!label) {
      return;
    }
    createPod.mutate(
      { label, color: newColor },
      {
        onSuccess: () => setNewLabel(''),
        onError: (error: unknown) =>
          showToast({
            message: (error as Error)?.message ?? localize('com_kmh_pods_create_error'),
            severity: NotificationSeverity.ERROR,
          }),
      },
    );
  };

  return (
    <section>
      <p className="mb-4 text-sm text-text-secondary">{localize('com_kmh_pods_intro')}</p>

      <div className="overflow-x-auto rounded-xl border border-border-light bg-surface-secondary px-4">
        <table className="w-full min-w-[34rem] text-left">
          <thead>
            <tr className="border-b border-border-light text-xs uppercase tracking-wide text-text-tertiary">
              <th className="py-2 pr-3 font-medium">{localize('com_kmh_pods_col_pod')}</th>
              <th className="py-2 pr-3 font-medium">{localize('com_kmh_pods_col_colour')}</th>
              <th className="py-2 pr-3 font-medium">{localize('com_kmh_pods_col_agents')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <PodRow key={pod.value} pod={pod} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-light bg-surface-secondary p-4">
        <Input
          value={newLabel}
          placeholder={localize('com_kmh_pods_new_name')}
          className="h-9 max-w-[16rem]"
          aria-label={localize('com_kmh_pods_new_name')}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <ColorRow value={newColor} onChange={setNewColor} />
        <Button
          type="button"
          size="sm"
          variant="submit"
          disabled={!newLabel.trim() || createPod.isLoading}
          onClick={add}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {localize('com_kmh_pods_add')}
        </Button>
      </div>
    </section>
  );
}

function AgentsPanel({ pods }: { pods: Pod[] }) {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data: agents = [], isLoading } = usePodAgentsQuery(true);
  const assign = useAssignAgents();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState('');
  const [search, setSearch] = useState('');

  const assignable = useMemo(() => pods.filter((pod) => pod.isActive), [pods]);
  const podByValue = useMemo(() => new Map(pods.map((pod) => [pod.value, pod])), [pods]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return agents;
    }
    return agents.filter((agent) => agent.name.toLowerCase().includes(needle));
  }, [agents, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const allVisibleSelected = visible.length > 0 && visible.every((agent) => selected.has(agent.id));

  const apply = () => {
    if (!target || selected.size === 0) {
      return;
    }
    assign.mutate(
      { agentIds: [...selected], pod: target },
      {
        onSuccess: (result) => {
          setSelected(new Set());
          showToast({ message: localize('com_kmh_agents_assigned', { count: result.updated }) });
        },
        onError: (error: unknown) =>
          showToast({
            message: (error as Error)?.message ?? localize('com_kmh_agents_assign_error'),
            severity: NotificationSeverity.ERROR,
          }),
      },
    );
  };

  /** Built as a value rather than nested ternaries in the JSX, which the lint
   *  rules disallow and which read worse anyway. */
  let rows;
  if (isLoading) {
    rows = (
      <tr>
        <td colSpan={4} className="py-6 text-sm text-text-secondary">
          {localize('com_kmh_agents_loading')}
        </td>
      </tr>
    );
  } else if (visible.length === 0) {
    rows = (
      <tr>
        <td colSpan={4} className="py-6 text-sm text-text-secondary">
          {localize('com_kmh_agents_empty')}
        </td>
      </tr>
    );
  } else {
    rows = visible.map((agent) => {
      const pod = podByValue.get(agent.category);
      return (
        <tr key={agent.id} className="border-b border-border-light last:border-b-0">
          <td className="py-2.5">
            <input
              type="checkbox"
              aria-label={localize('com_kmh_agents_select_one', { name: agent.name })}
              checked={selected.has(agent.id)}
              onChange={() => toggle(agent.id)}
            />
          </td>
          <td className="py-2.5 pr-3 text-sm text-text-primary">{agent.name}</td>
          <td className="py-2.5 pr-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', podColor(pod?.color).dot)}
                aria-hidden="true"
              />
              {pod?.label ?? localize('com_kmh_agents_unassigned')}
            </span>
          </td>
          <td className="py-2.5 font-mono text-xs text-text-tertiary">{agent.model || '—'}</td>
        </tr>
      );
    });
  }

  return (
    <section>
      <p className="mb-4 text-sm text-text-secondary">{localize('com_kmh_agents_intro')}</p>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          placeholder={localize('com_kmh_agents_filter')}
          className="h-9 max-w-[16rem]"
          aria-label={localize('com_kmh_agents_filter')}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">
            {localize('com_kmh_agents_selected', { count: selected.size })}
          </span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label={localize('com_kmh_agents_target_label')}
            className="h-9 rounded-lg border border-border-medium bg-surface-primary px-2 text-sm text-text-primary"
          >
            <option value="">{localize('com_kmh_agents_move_to')}</option>
            {assignable.map((pod) => (
              <option key={pod.value} value={pod.value}>
                {pod.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="submit"
            disabled={!target || selected.size === 0 || assign.isLoading}
            onClick={apply}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            {localize('com_kmh_agents_assign')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-light bg-surface-secondary px-4">
        <table className="w-full min-w-[34rem] text-left">
          <thead>
            <tr className="border-b border-border-light text-xs uppercase tracking-wide text-text-tertiary">
              <th className="w-8 py-2">
                <input
                  type="checkbox"
                  aria-label={localize('com_kmh_agents_select_all')}
                  checked={allVisibleSelected}
                  onChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      visible.forEach((agent) =>
                        allVisibleSelected ? next.delete(agent.id) : next.add(agent.id),
                      );
                      return next;
                    })
                  }
                />
              </th>
              <th className="py-2 pr-3 font-medium">{localize('com_kmh_agents_col_agent')}</th>
              <th className="py-2 pr-3 font-medium">{localize('com_kmh_agents_col_pod')}</th>
              <th className="py-2 font-medium">{localize('com_kmh_agents_col_model')}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </section>
  );
}

const TABS = [
  ['pods', 'com_kmh_admin_tab_pods'],
  ['agents', 'com_kmh_admin_tab_agents'],
] as const;

export default function KmhAdmin() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const isAdmin = user?.role === SystemRoles.ADMIN;
  const { data: pods = [], isLoading, error } = usePodsQuery(isAdmin);
  const [tab, setTab] = useState<'pods' | 'agents'>('pods');

  if (!isAdmin) {
    return (
      <main className="flex h-full items-center justify-center bg-presentation text-text-secondary">
        <p className="text-sm">{localize('com_kmh_admin_required')}</p>
      </main>
    );
  }

  let body;
  if (error) {
    body = (
      <p className="text-sm text-text-secondary">
        {localize('com_kmh_admin_load_error', {
          message: (error as Error)?.message ?? localize('com_kmh_admin_unknown_error'),
        })}
      </p>
    );
  } else if (isLoading) {
    body = <p className="text-sm text-text-secondary">{localize('com_kmh_admin_loading')}</p>;
  } else if (tab === 'pods') {
    body = <PodsPanel pods={pods} />;
  } else {
    body = <AgentsPanel pods={pods} />;
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-auto bg-presentation text-text-primary">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-10 pt-8 md:px-6">
        <h1 className="text-2xl font-semibold">{localize('com_kmh_admin_title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{localize('com_kmh_admin_subtitle')}</p>

        <div
          className="mt-6 flex gap-1.5"
          role="tablist"
          aria-label={localize('com_kmh_admin_sections')}
        >
          {TABS.map(([value, labelKey]) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                tab === value
                  ? 'bg-surface-hover text-text-primary'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary',
              )}
            >
              {localize(labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-6">{body}</div>
      </div>
    </main>
  );
}
