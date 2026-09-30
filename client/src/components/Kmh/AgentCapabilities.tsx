import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from 'librechat-data-provider';
import { BookOpen, CalendarPlus, Database, Globe, Sparkles, Wrench } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

/**
 * KMH: what this agent can do, shown under its name on the landing screen.
 *
 * The description field alone was not enough — it is prose someone writes once
 * and nobody updates, so an agent that gained a Stratos planner last week still
 * introduced itself as a copywriter. This reads the agent's actual wiring, so
 * it cannot drift.
 *
 * Renders nothing at all when the agent has no tools, no files and no skills:
 * an empty capability strip is worse than none, it just looks broken.
 */

interface Capabilities {
  id: string;
  model: string;
  dataSources: { name: string; kind: string; writes: boolean | null }[];
  knowledgeFiles: number;
  skills: string[];
  abilities: {
    fileSearch: boolean;
    webSearch: boolean;
    executeCode: boolean;
    artifacts: boolean;
  };
}

function Chip({
  icon: Icon,
  children,
  tone = 'default',
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  tone?: 'default' | 'write';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
        tone === 'write'
          ? 'border-amber-500/40 text-amber-500'
          : 'border-border-light text-text-secondary',
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

const AgentCapabilities = memo(({ agentId }: { agentId?: string }) => {
  const localize = useLocalize();
  const { data } = useQuery<Capabilities>({
    queryKey: ['kmh', 'agentCapabilities', agentId],
    queryFn: () => request.get(`/api/agents/${encodeURIComponent(agentId as string)}/capabilities`),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!data) {
    return null;
  }

  const klaviyo = data.dataSources.filter((d) => d.kind === 'klaviyo');
  const stratos = data.dataSources.filter((d) => d.kind === 'stratos');
  const other = data.dataSources.filter((d) => d.kind === 'other');

  const chips: React.ReactNode[] = [];

  for (const d of klaviyo) {
    chips.push(
      <Chip key={`k-${d.name}`} icon={Database}>
        {localize('com_kmh_cap_data', { brand: d.name })}
      </Chip>,
    );
  }
  /* Called out separately, and in amber: this is the one connection that
     writes. Someone about to ask for a calendar should know before they ask. */
  for (const d of stratos) {
    chips.push(
      <Chip key={`s-${d.name}`} icon={CalendarPlus} tone="write">
        {localize('com_kmh_cap_planner', { brand: d.name.replace(/ Planner$/, '') })}
      </Chip>,
    );
  }
  for (const d of other) {
    chips.push(
      <Chip key={`o-${d.name}`} icon={Wrench}>
        {d.name}
      </Chip>,
    );
  }
  if (data.knowledgeFiles > 0) {
    chips.push(
      <Chip key="files" icon={BookOpen}>
        {data.knowledgeFiles === 1
          ? localize('com_kmh_cap_files_one')
          : localize('com_kmh_cap_files', { count: data.knowledgeFiles })}
      </Chip>,
    );
  }
  for (const s of data.skills) {
    chips.push(
      <Chip key={`skill-${s}`} icon={Sparkles}>
        {s}
      </Chip>,
    );
  }
  if (data.abilities.webSearch) {
    chips.push(
      <Chip key="web" icon={Globe}>
        {localize('com_kmh_cap_web')}
      </Chip>,
    );
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-1.5 px-4">{chips}</div>
  );
});

AgentCapabilities.displayName = 'AgentCapabilities';

export default AgentCapabilities;
