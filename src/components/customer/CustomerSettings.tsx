// Customer account tab: profile, saved addresses, notification preferences, password, logout.

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, LogOut, MapPin, Plus, Trash2, User as UserIcon, Bell } from 'lucide-react';
import type { NotificationPreferences } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError, initials, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500';

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export default function CustomerSettings() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col items-center gap-2 pt-2 pb-2">
        <span className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white" style={{ background: user.avatarColor }} aria-hidden>
          {initials(user.fullName)}
        </span>
        <p className="text-lg font-bold text-slate-900">{user.fullName}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>
      <ProfileSection />
      <AddressesSection />
      <NotificationSection />
      <PasswordSection />
      <ActionButton variant="danger" fullWidth onClick={logout} icon={<LogOut size={16} />}>
        Log out
      </ActionButton>
      <p className="pb-2 text-center text-[11px] text-slate-400">HelpDesk v1.0 · Made in Sri Lanka</p>
    </div>
  );
}

function ProfileSection() {
  const { user, api, refresh } = useAuth();
  const [form, setForm] = useState({ fullName: user!.fullName, phone: user!.phone ?? '' });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await api.users.update(form);
      await refresh();
      setStatus('Saved');
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section icon={<UserIcon size={16} />} title="Profile">
      <form onSubmit={save} className="space-y-2">
        <input className={input} aria-label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className={input} aria-label="Mobile number" placeholder="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div className="flex items-center gap-3">
          <ActionButton type="submit" size="sm" loading={busy}>
            Save
          </ActionButton>
          {status && <span className="text-xs text-slate-500">{status}</span>}
        </div>
      </form>
    </Section>
  );
}

function AddressesSection() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.users.addresses());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: 'Home', line1: '', city: '' });
  const [error, setError] = useState<ApiRequestError | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.users.addAddress(form);
      setAdding(false);
      setForm({ label: 'Home', line1: '', city: '' });
    } catch (err) {
      setError(err as ApiRequestError);
    }
  };

  return (
    <Section icon={<MapPin size={16} />} title="Saved addresses">
      <ul className="space-y-2">
        {data?.addresses.map((a) => (
          <li key={a.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">
                {a.label} {a.isDefault && <span className="ml-1 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">Default</span>}
              </p>
              <p className="truncate text-xs text-slate-500">
                {a.line1}, {a.city}
              </p>
            </div>
            {!a.isDefault && (
              <button type="button" onClick={() => api.users.setDefaultAddress(a.id)} className="text-xs font-medium text-brand-700">
                Make default
              </button>
            )}
            <button type="button" onClick={() => api.users.deleteAddress(a.id)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${a.label}`}>
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form onSubmit={add} className="mt-3 space-y-2">
          <input className={input} placeholder="Label (Home, Office...)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input className={input} placeholder="Street address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          {error?.fieldError('line1') && <p className="text-xs text-red-600">{error.fieldError('line1')}</p>}
          <input className={input} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          {error?.fieldError('city') && <p className="text-xs text-red-600">{error.fieldError('city')}</p>}
          <div className="flex gap-2">
            <ActionButton type="submit" size="sm">
              Save address
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </ActionButton>
          </div>
        </form>
      ) : (
        <ActionButton variant="secondary" size="sm" className="mt-3" onClick={() => setAdding(true)} icon={<Plus size={14} />}>
          Add address
        </ActionButton>
      )}
    </Section>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span>
        <span className="block text-sm text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function NotificationSection() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.users.settings());
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');

  useEffect(() => {
    if (data) {
      setPrefs(data.settings.notifications);
      setLanguage(data.settings.language);
    }
  }, [data]);

  if (!prefs) return null;

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    api.users.updateSettings({ notifications: next }).catch(() => setPrefs(prefs));
  };

  return (
    <Section icon={<Bell size={16} />} title="Notifications & language">
      <Toggle label="Booking updates" description="Status changes, quotes and invoices" checked={prefs.bookingUpdates} onChange={(v) => update('bookingUpdates', v)} />
      <Toggle label="Messages" description="New chat messages" checked={prefs.messages} onChange={(v) => update('messages', v)} />
      <Toggle label="Offers" description="Seasonal discounts and tips" checked={prefs.promotions} onChange={(v) => update('promotions', v)} />
      <label className="mt-2 flex items-center justify-between text-sm text-slate-800">
        Language
        <select
          value={language}
          onChange={(e) => {
            const value = e.target.value as 'en' | 'si' | 'ta';
            setLanguage(value);
            api.users.updateSettings({ language: value });
          }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
        >
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
      </label>
    </Section>
  );
}

export function PasswordSection() {
  const { api } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.users.changePassword(form.currentPassword, form.newPassword);
      setDone(true);
      setOpen(false);
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err as ApiRequestError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section icon={<KeyRound size={16} />} title="Password">
      {open ? (
        <form onSubmit={save} className="space-y-2">
          <input type="password" autoComplete="current-password" className={input} placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          {error?.fieldError('currentPassword') && <p className="text-xs text-red-600">{error.fieldError('currentPassword')}</p>}
          <input type="password" autoComplete="new-password" className={input} placeholder="New password (8+ characters)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          {error?.fieldError('newPassword') && <p className="text-xs text-red-600">{error.fieldError('newPassword')}</p>}
          <div className="flex gap-2">
            <ActionButton type="submit" size="sm" loading={busy}>
              Change password
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <ActionButton variant="secondary" size="sm" onClick={() => { setOpen(true); setDone(false); }}>
            Change password
          </ActionButton>
          {done && <span className="text-xs text-green-700">Password changed</span>}
        </div>
      )}
    </Section>
  );
}
