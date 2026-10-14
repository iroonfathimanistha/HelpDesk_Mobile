import type { ReactNode } from 'react';
import AndroidStatusBar from './AndroidStatusBar';

/**
 * Phone-shaped frame for the customer and provider apps. Children fill the screen area,
 * which is `relative` so modals inside an app (e.g. NotificationsModal) stay inside the phone.
 * On small screens the frame drops away and the app fills the viewport.
 */
export default function MobileAppContainer({ variant, label, children }: { variant: 'customer' | 'provider'; label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <p className={`rounded-full px-3 py-1 text-xs font-semibold ${variant === 'provider' ? 'bg-provider-100 text-provider-700' : 'bg-brand-100 text-brand-700'}`}>{label}</p>
      )}
      <div className="w-[min(390px,100vw)] sm:rounded-[2.75rem] sm:bg-slate-900 sm:p-3 sm:shadow-2xl">
        <div className="relative flex h-[min(820px,calc(100vh-7rem))] min-h-[600px] flex-col overflow-hidden bg-white sm:rounded-[2.1rem]">
          <AndroidStatusBar />
          <div className="relative min-h-0 flex-1">{children}</div>
          <div className="flex h-5 shrink-0 items-center justify-center bg-white" aria-hidden>
            <span className="h-1 w-28 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
