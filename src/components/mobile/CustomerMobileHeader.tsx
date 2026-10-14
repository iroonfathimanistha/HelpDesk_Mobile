import { Bell, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../services/api';
import { useUnreadCount } from '../common/NotificationsModal';

export default function CustomerMobileHeader({ city, onNotifications, onProfile }: { city?: string; onNotifications: () => void; onProfile: () => void }) {
  const { user } = useAuth();
  const unread = useUnreadCount();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex items-center gap-3 bg-brand-600 px-4 pt-3 pb-4 text-white">
      <button type="button" onClick={onProfile} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ring-2 ring-white/40" style={{ background: user?.avatarColor }} aria-label="Your profile">
        {user ? initials(user.fullName) : ''}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/70">{greeting},</p>
        <p className="truncate font-semibold">{user?.fullName.split(' ')[0]}</p>
      </div>
      {city && (
        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs">
          <MapPin size={12} /> {city}
        </span>
      )}
      <button type="button" onClick={onNotifications} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell size={20} />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{unread > 9 ? '9+' : unread}</span>}
      </button>
    </div>
  );
}
