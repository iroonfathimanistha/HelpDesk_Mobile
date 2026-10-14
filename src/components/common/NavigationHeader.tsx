import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

/** Header for a pushed screen inside a phone app: back button, title, optional actions. */
export default function NavigationHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white/95 px-2 py-2 backdrop-blur">
      {onBack ? (
        <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full text-slate-700 hover:bg-slate-100" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span className="w-2" />
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
