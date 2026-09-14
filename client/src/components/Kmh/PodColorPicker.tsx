import { memo } from 'react';
import { POD_COLORS, POD_COLOR_KEYS, type PodColorKey } from './podColors';

/** Swatch row for choosing a project's pod colour. */
const PodColorPicker = memo(
  ({ value, onChange }: { value?: string | null; onChange: (v: PodColorKey) => void }) => {
    const current = (value as PodColorKey) in POD_COLORS ? (value as PodColorKey) : 'none';
    return (
      <div className="flex flex-wrap items-center gap-2">
        {POD_COLOR_KEYS.map((key) => {
          const selected = key === current;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              title={POD_COLORS[key].label}
              aria-label={POD_COLORS[key].label}
              aria-pressed={selected}
              className={`h-6 w-6 rounded-full transition ${POD_COLORS[key].dot} ${
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

PodColorPicker.displayName = 'PodColorPicker';

export default PodColorPicker;
