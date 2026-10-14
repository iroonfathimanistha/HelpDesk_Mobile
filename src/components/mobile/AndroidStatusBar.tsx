import { useEffect, useState } from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

/** Fake Android status bar with a live clock. */
export default function AndroidStatusBar({ dark = false }: { dark?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`relative flex h-7 shrink-0 items-center justify-between px-5 text-[12px] font-semibold ${dark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`} aria-hidden>
      <span>{time}</span>
      <span className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-slate-900 ring-2 ring-slate-700" />
      <span className="flex items-center gap-1">
        <Signal size={13} />
        <Wifi size={13} />
        <BatteryFull size={16} />
      </span>
    </div>
  );
}
