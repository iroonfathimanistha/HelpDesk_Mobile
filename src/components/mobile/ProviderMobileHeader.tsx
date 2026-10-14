import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../services/api';
import { useUnreadCount } from '../common/NotificationsModal';

/** Provider app header with the online/offline switch. */
export default function ProviderMobileHeader({ onNotifications }: { onNotifications: () => void }) {
  const { user, providerProfile, api, refresh } = useAuth();
  const unread = useUnreadCount();
  const [busy, setBusy] = useState(false);
  const online = providerProfile?.isAvailable ?? false;
  const approved = providerProfile?.status === 'APPROVED';

  const toggle = async () => {
    setBusy(true);
    try {
      await api.provider.update({ isAvailable: !online });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900 px-4 pt-3 pb-4 text-white">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ring-2 ring-provider-500" style={{ background: user?.avatarColor }} aria-hidden>
        {user ? initials(user.fullName) : ''}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{user?.fullName}</p>
        <p className="text-xs text-slate-400">{providerProfile ? `★ ${providerProfile.averageRating.toFixed(1)} · ${providerProfile.completedJobs} jobs` : ''}</p>
      </div>
      {approved && (
        <button
          type="button"
          role="switch"
          aria-checked={online}
          disabled={busy}
          onClick={toggle}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${online ? 'bg-provider-500 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-white' : 'bg-slate-400'}`} />
          {online ? 'Online' : 'Offline'}
        </button>
      )}
      <button type="button" onClick={onNotifications} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell size={20} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{unread > 9 ? '9+' : unread}</span>}
      </button>
    </div>
  );
}
