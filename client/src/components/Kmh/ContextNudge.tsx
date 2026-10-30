import { memo, useState } from 'react';
import { Button } from '@librechat/client';
import type { TConversation } from 'librechat-data-provider';
import useCompactConversation from '~/hooks/Chat/useCompactConversation';
import useTokenUsage from '~/hooks/Chat/useTokenUsage';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

/**
 * KMH: a quiet word when a thread has grown expensive.
 *
 * Deliberately triggered on context used, not on message count. Ten short
 * questions cost almost nothing; two that each pull the full playbook cost a
 * great deal, and a count cannot tell them apart.
 *
 * It offers compaction first and a new chat second, in that order on purpose.
 * Starting again looks like the cheap option and often is not: a fresh thread
 * re-runs the agent's required playbook loads, which measured about 13k
 * uncached tokens on this fleet. Compaction shrinks the history while keeping
 * everything already loaded, so it is usually the cheaper of the two.
 */
const WARN_AT = 60;
const URGENT_AT = 80;

const ContextNudge = memo(
  ({
    index,
    conversation,
    isSubmitting,
  }: {
    index: number;
    conversation: TConversation | null;
    isSubmitting: boolean;
  }) => {
    const localize = useLocalize();
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);
    const { percent, hasUsage } = useTokenUsage({ index, conversation, isSubmitting });
    /** The hook reads the chat context itself and already knows whether this
     *  leaf can be compacted (not mid-submit, not an existing compaction). */
    const { compact, canCompact, isCompacting } = useCompactConversation();

    const urgent = percent >= URGENT_AT;
    /** Dismissal holds until the thread crosses the next threshold, so one
     *  wave-away does not silence the warning for a conversation that keeps
     *  growing. */
    const silenced = dismissedAt != null && percent < (dismissedAt >= URGENT_AT ? 101 : URGENT_AT);

    if (!hasUsage || percent < WARN_AT || silenced || isSubmitting) {
      return null;
    }

    return (
      <div
        role="status"
        className={cn(
          'mx-auto mb-2 flex w-full max-w-3xl flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 text-xs',
          urgent
            ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400'
            : 'border-border-light text-text-secondary',
        )}
      >
        <span className="min-w-0 flex-1">
          {localize(urgent ? 'com_kmh_context_urgent' : 'com_kmh_context_warn', {
            percent: Math.round(percent),
          })}
        </span>
        {canCompact ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0"
            disabled={isCompacting}
            onClick={compact}
          >
            {localize('com_kmh_context_compact')}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 text-text-secondary"
          onClick={() => setDismissedAt(percent)}
        >
          {localize('com_kmh_context_dismiss')}
        </Button>
      </div>
    );
  },
);

ContextNudge.displayName = 'ContextNudge';

export default ContextNudge;
