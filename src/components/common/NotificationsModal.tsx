import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellOff, Briefcase, CheckCheck, MessageCircle, ReceiptText, ShieldCheck, Star, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppNotification, NotificationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, useLiveData } from '../../services/api';

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  BOOKING_UPDATE: Briefcase,
  NEW_JOB: Briefcase,
  COST_PROPOSAL: ReceiptText,
  MESSAGE: MessageCircle,
  REVIEW: Star,
  VERIFICATION: ShieldCheck,
  COMPLAINT: TriangleAlert,
  SYSTEM: Bell,
};

/** Unread notification count for the bell badge. Refreshes live. */
export function useUnreadCount(): number {
  const { api, user } = useAuth();
  const { data } = useLiveData(user ? () => api.notifications.list() : null, [user?.id]);
  return data?.unread ?? 0;
}

/**
 * Slide-down notification panel. Rendered inside a phone frame (absolute positioning)
 * or the admin layout. Tapping a notification marks it read and calls `onOpen`.
 */
export default function NotificationsModal({
  open,
  onClose,
  onOpen,
  accent = 'brand',
}: {
  open: boolean;
  onClose: () => void;
  onOpen?: (notification: AppNotification) => void;
  accent?: 'brand' | 'provider';
}) {
  const { api, user } = useAuth();
  const { data } = useLiveData(open && user ? () => api.notifications.list() : null, [open, user?.id]);
  const notifications = data?.notifications ?? [];
  const accentText = accent === 'provider' ? 'text-provider-700' : 'text-brand-700';
  const accentBg = accent === 'provider' ? 'bg-provider-50' : 'bg-brand-50';

  const handleOpen = async (n: AppNotification) => {
    if (!n.readAt) await api.notifications.markRead(n.id).catch(() => undefined);
    onOpen?.(n);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40 flex flex-col bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label="Notifications"
            className="flex max-h-[85%] flex-col rounded-b-3xl bg-white shadow-xl"
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="font-semibold text-slate-900">Notifications</h2>
              <div className="flex items-center gap-1">
                {notifications.some((n) => !n.readAt) && (
                  <button type="button" onClick={() => api.notifications.markAllRead()} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${accentText} hover:bg-slate-50`}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
                <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close notifications">
                  <X size={18} />
                </button>
              </div>
            </div>
            <ul className="phone-scroll flex-1 overflow-y-auto">
              {data && notifications.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
                  <BellOff size={28} className="text-slate-300" />
                  You're all caught up.
                </li>
              )}
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => handleOpen(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.readAt ? '' : accentBg}`}>
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white ring-1 ring-slate-200 ${accentText}`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={`text-sm ${n.readAt ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{n.title}</span>
                          <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.body}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
