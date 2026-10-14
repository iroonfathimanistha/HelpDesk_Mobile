import React, { useEffect, useState } from 'react';
import { Notification } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck, Clock, ExternalLink, X, AlertTriangle, ShieldCheck, Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const NotificationsModal: React.FC<Props> = ({ isOpen, onClose, onSelectBooking }) => {
  const { user, setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickItem = (notif: Notification) => {
    if (!notif.isRead) {
      api.markNotificationAsRead(notif.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.bookingId && onSelectBooking) {
      onSelectBooking(notif.bookingId);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_UPDATE':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'VERIFICATION':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'REVIEW':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Notifications</h3>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.isRead).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">Updates on your bookings and account will appear here</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`p-4 rounded-xl cursor-pointer transition flex items-start gap-3 relative ${
                  !n.isRead ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5 p-2 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className={`text-sm font-semibold truncate ${!n.isRead ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  {n.bookingId && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700">
                      View details <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {!n.isRead && (
                  <button
                    onClick={(e) => handleMarkAsRead(n.id, e)}
                    title="Mark as read"
                    className="absolute right-3 top-4 w-2.5 h-2.5 bg-blue-600 rounded-full hover:scale-125 transition"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Persisted in real-time database</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};