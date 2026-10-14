import {
  AirVent,
  Brush,
  Droplets,
  Hammer,
  Leaf,
  PaintRoller,
  Sparkles,
  Toolbox,
  WashingMachine,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { CategorySlug } from '../../types';

export const CATEGORY_STYLES: Record<CategorySlug, { icon: LucideIcon; bg: string; fg: string }> = {
  plumbing: { icon: Droplets, bg: 'bg-sky-100', fg: 'text-sky-700' },
  electrical: { icon: Zap, bg: 'bg-amber-100', fg: 'text-amber-700' },
  'ac-refrigeration': { icon: AirVent, bg: 'bg-cyan-100', fg: 'text-cyan-700' },
  carpentry: { icon: Hammer, bg: 'bg-orange-100', fg: 'text-orange-700' },
  masonry: { icon: Toolbox, bg: 'bg-stone-200', fg: 'text-stone-700' },
  painting: { icon: PaintRoller, bg: 'bg-pink-100', fg: 'text-pink-700' },
  'appliance-repair': { icon: WashingMachine, bg: 'bg-violet-100', fg: 'text-violet-700' },
  cleaning: { icon: Sparkles, bg: 'bg-teal-100', fg: 'text-teal-700' },
  gardening: { icon: Leaf, bg: 'bg-green-100', fg: 'text-green-700' },
  other: { icon: Brush, bg: 'bg-slate-200', fg: 'text-slate-700' },
};

export function CategoryIcon({ slug, size = 'md' }: { slug: CategorySlug; size?: 'sm' | 'md' | 'lg' }) {
  const style = CATEGORY_STYLES[slug] ?? CATEGORY_STYLES.other;
  const Icon = style.icon;
  const box = { sm: 'h-8 w-8 rounded-lg', md: 'h-11 w-11 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size];
  const iconSize = { sm: 16, md: 22, lg: 28 }[size];
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${style.bg} ${style.fg}`} aria-hidden>
      <Icon size={iconSize} />
    </span>
  );
}
