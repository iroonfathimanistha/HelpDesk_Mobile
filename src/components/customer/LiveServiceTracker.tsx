// Simulated live map: shows the provider travelling from their base to the customer's
// address once they tap "Start journey". Real GPS tracking would replace `progress`
// with positions sent from the provider app.

import { useEffect, useState } from 'react';
import { Home, Navigation } from 'lucide-react';
import type { BookingDetail } from '../../types';

/** How long the simulated drive takes in the demo, whatever the real distance. */
const DEMO_DRIVE_MS = 90_000;
const AVERAGE_SPEED_KMH = 25;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useTravelProgress(booking: Pick<BookingDetail, 'status' | 'onTheWayAt'>): number {
  const [now, setNow] = useState(() => Date.now());
  const travelling = booking.status === 'ON_THE_WAY';

  useEffect(() => {
    if (!travelling) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [travelling]);

  if (booking.status === 'PENDING' || booking.status === 'ACCEPTED') return 0;
  if (!travelling) return 1;
  const started = booking.onTheWayAt ? Date.parse(booking.onTheWayAt) : now;
  return Math.min(0.97, Math.max(0, (now - started) / DEMO_DRIVE_MS));
}

export default function LiveServiceTracker({ booking }: { booking: BookingDetail }) {
  const progress = useTravelProgress(booking);
  const provider = booking.provider;
  if (!provider) return null;

  const km = distanceKm(provider.latitude, provider.longitude, booking.latitude, booking.longitude);
  const etaMinutes = Math.max(1, Math.round(((km / AVERAGE_SPEED_KMH) * 60 + 3) * (1 - progress)));

  // Route drawn in a 320x180 box from bottom-left (provider base) to top-right (home).
  const start = { x: 40, y: 145 };
  const end = { x: 270, y: 45 };
  const control = { x: 90, y: 40 };
  const t = progress;
  const point = {
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
  };

  const headline =
    booking.status === 'ACCEPTED'
      ? `${provider.fullName.split(' ')[0]} will start the journey soon`
      : booking.status === 'ON_THE_WAY'
        ? `Arriving in about ${etaMinutes} min`
        : `${provider.fullName.split(' ')[0]} has arrived`;

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
      <svg viewBox="0 0 320 180" className="block h-auto w-full bg-[#eef2e6]" role="img" aria-label={`Map: ${headline}. ${km.toFixed(1)} km away.`}>
        {/* Blocks and roads */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="0" y1={20 + i * 38} x2="320" y2={20 + i * 38} stroke="#ffffff" strokeWidth="7" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={25 + i * 58} y1="0" x2={25 + i * 58} y2="180" stroke="#ffffff" strokeWidth="7" />
        ))}
        <rect x="190" y="110" width="70" height="45" rx="6" fill="#cfe3c1" />
        <path d="M0 170 Q 160 150 320 175 L320 180 L0 180 Z" fill="#bfdcf5" />
        {/* Route */}
        <path d={`M${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`} fill="none" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 9" />
        {/* Home */}
        <circle cx={end.x} cy={end.y} r="16" fill="#2563eb" opacity="0.15" />
        <circle cx={end.x} cy={end.y} r="10" fill="#2563eb" />
        {/* Provider */}
        <g transform={`translate(${point.x} ${point.y})`} style={{ transition: 'transform 1s linear' }}>
          {booking.status === 'ON_THE_WAY' && <circle r="16" fill="#10b981" className="radar-ping" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />}
          <circle r="10" fill="#059669" stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
      <div className="flex items-center gap-3 p-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-provider-100 text-provider-700">
          {booking.status === 'ON_THE_WAY' ? <Navigation size={18} /> : <Home size={18} />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{headline}</p>
          <p className="text-xs text-slate-500">
            From {provider.city} · {km.toFixed(1)} km
          </p>
        </div>
      </div>
      {booking.status === 'ON_THE_WAY' && (
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-provider-500 transition-all duration-1000" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
