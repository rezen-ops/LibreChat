/**
 * KMH pod colours for chat projects.
 *
 * A fixed palette rather than a free colour picker: projects then stay visually
 * consistent, and every value is checked to read correctly on both the light and
 * dark sidebar. A free hex field would eventually produce a pod nobody can see.
 *
 * Keys are stored in the database — never rename one without a migration, or
 * existing projects silently lose their colour.
 */
export type PodColorKey =
  | 'none'
  | 'slate'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'green'
  | 'blue';

export const POD_COLORS: Record<PodColorKey, { label: string; dot: string; rail: string }> = {
  none: { label: 'No colour', dot: 'bg-transparent border border-border-medium', rail: '' },
  slate: { label: 'Slate', dot: 'bg-slate-400', rail: 'bg-slate-400' },
  teal: { label: 'Teal', dot: 'bg-teal-500', rail: 'bg-teal-500' },
  amber: { label: 'Amber', dot: 'bg-amber-500', rail: 'bg-amber-500' },
  rose: { label: 'Rose', dot: 'bg-rose-500', rail: 'bg-rose-500' },
  violet: { label: 'Violet', dot: 'bg-violet-500', rail: 'bg-violet-500' },
  green: { label: 'Green', dot: 'bg-green-500', rail: 'bg-green-500' },
  blue: { label: 'Blue', dot: 'bg-blue-500', rail: 'bg-blue-500' },
};

export const POD_COLOR_KEYS = Object.keys(POD_COLORS) as PodColorKey[];

/** Unknown or empty values fall back to 'none' rather than breaking the row. */
export const podColor = (key?: string | null) =>
  POD_COLORS[(key as PodColorKey) in POD_COLORS ? (key as PodColorKey) : 'none'];
