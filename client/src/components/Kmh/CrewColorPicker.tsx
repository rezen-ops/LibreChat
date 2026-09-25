import { memo } from 'react';
import { CREW_COLORS, CREW_COLOR_KEYS, type CrewColorKey } from './crewColors';

/** Swatch row for choosing a project's crew colour. */
const CrewColorPicker = memo(
  ({ value, onChange }: { value?: string | null; onChange: (v: CrewColorKey) => void }) => {
    const current = (value as CrewColorKey) in CREW_COLORS ? (value as CrewColorKey) : 'none';
    return (
      <div className="flex flex-wrap items-center gap-2">
        {CREW_COLOR_KEYS.map((key) => {
          const selected = key === current;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              title={CREW_COLORS[key].label}
              aria-label={CREW_COLORS[key].label}
              aria-pressed={selected}
              className={`h-6 w-6 rounded-full transition ${CREW_COLORS[key].dot} ${
                selected
                  ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-surface-primary'
                  : 'hover:scale-110'
              }`}
            />
          );
        })}
      </div>
    );
  },
);

CrewColorPicker.displayName = 'CrewColorPicker';

export default CrewColorPicker;
