/**
 * KMH crew colours.
 *
 * A fixed palette rather than a free colour picker: crews and projects then stay
 * visually consistent, and every value is checked to read correctly on both the
 * light and dark sidebar. A free hex field would eventually produce a crew
 * nobody can see.
 *
 * Keys are stored in the database — never rename one without a migration, or
 * existing crews and projects silently lose their colour. Adding is safe.
 * There are ten crews, so the palette carries eleven hues chosen to stay
 * distinguishable side by side in a tab strip.
 */
export type CrewColorKey =
  | 'none'
  | 'slate'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'green'
  | 'blue'
  | 'cyan'
  | 'orange'
  | 'fuchsia';

export const CREW_COLORS: Record<
  CrewColorKey,
  { label: string; dot: string; rail: string; text: string }
> = {
  none: {
    label: 'No colour',
    dot: 'bg-transparent border border-border-medium',
    rail: '',
    text: 'text-text-secondary',
  },
  slate: { label: 'Slate', dot: 'bg-slate-400', rail: 'bg-slate-400', text: 'text-slate-400' },
  teal: { label: 'Teal', dot: 'bg-teal-500', rail: 'bg-teal-500', text: 'text-teal-500' },
  amber: { label: 'Amber', dot: 'bg-amber-500', rail: 'bg-amber-500', text: 'text-amber-500' },
  rose: { label: 'Rose', dot: 'bg-rose-500', rail: 'bg-rose-500', text: 'text-rose-500' },
  violet: { label: 'Violet', dot: 'bg-violet-500', rail: 'bg-violet-500', text: 'text-violet-500' },
  green: { label: 'Green', dot: 'bg-green-500', rail: 'bg-green-500', text: 'text-green-500' },
  blue: { label: 'Blue', dot: 'bg-blue-500', rail: 'bg-blue-500', text: 'text-blue-500' },
  cyan: { label: 'Cyan', dot: 'bg-cyan-500', rail: 'bg-cyan-500', text: 'text-cyan-500' },
  orange: { label: 'Orange', dot: 'bg-orange-500', rail: 'bg-orange-500', text: 'text-orange-500' },
  fuchsia: {
    label: 'Fuchsia',
    dot: 'bg-fuchsia-500',
    rail: 'bg-fuchsia-500',
    text: 'text-fuchsia-500',
  },
};

export const CREW_COLOR_KEYS = Object.keys(CREW_COLORS) as CrewColorKey[];

/** Unknown or empty values fall back to 'none' rather than breaking the row. */
export const crewColor = (key?: string | null) =>
  CREW_COLORS[(key as CrewColorKey) in CREW_COLORS ? (key as CrewColorKey) : 'none'];
