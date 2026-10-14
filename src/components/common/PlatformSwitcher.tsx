import { Columns2, LayoutDashboard, Smartphone, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Platform = 'dual' | 'customer' | 'provider' | 'admin';

const OPTIONS: { value: Platform; label: string; short: string; icon: LucideIcon }[] = [
  { value: 'dual', label: 'Dual View', short: 'Dual', icon: Columns2 },
  { value: 'customer', label: 'Customer App', short: 'Customer', icon: Smartphone },
  { value: 'provider', label: 'Provider App', short: 'Provider', icon: Wrench },
  { value: 'admin', label: 'Admin Dashboard', short: 'Admin', icon: LayoutDashboard },
];

export default function PlatformSwitcher({ value, onChange }: { value: Platform; onChange: (platform: Platform) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold text-white">HD</div>
          <div className="leading-tight">
            <p className="font-bold text-slate-900">HelpDesk</p>
            <p className="text-xs text-slate-500">Home services, Sri Lanka</p>
          </div>
        </div>
        <nav aria-label="Choose an app" className="flex rounded-xl bg-slate-100 p-1">
          {OPTIONS.map(({ value: option, label, short, icon: Icon }) => {
            const active = option === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} aria-hidden />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
