// Admin web dashboard: overview stats, provider verification queue, bookings, users,
// complaints, pricing rules and the audit log.

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  BadgeCheck,
  Bell,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  Loader2,
  LogOut,
  RotateCcw,
  ShieldAlert,
  Tags,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminComplaintRow, BookingStatus, PricingRule, VerificationRequest } from '../../types';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError, formatDateTime, formatLkr, initials, timeAgo, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';
import NotificationsModal, { useUnreadCount } from '../common/NotificationsModal';

type Section = 'overview' | 'verification' | 'bookings' | 'users' | 'complaints' | 'pricing' | 'audit';

const SECTIONS: { value: Section; label: string; icon: LucideIcon }[] = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'verification', label: 'Verification', icon: BadgeCheck },
  { value: 'bookings', label: 'Bookings', icon: ClipboardList },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'complaints', label: 'Complaints', icon: ShieldAlert },
  { value: 'pricing', label: 'Pricing', icon: Tags },
  { value: 'audit', label: 'Audit log', icon: FileClock },
];

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid w-full place-items-center py-20 text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return user ? <AdminShell /> : <AdminLogin />;
}

function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@helpdesk.lk');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500';
  return (
    <div className="flex w-full items-start justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HelpDesk Admin</h1>
          <p className="text-sm text-slate-500">Staff sign-in</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Email</span>
          <input type="email" autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Password</span>
          <input type="password" autoComplete="current-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <ActionButton type="submit" fullWidth loading={busy}>
          Sign in
        </ActionButton>
        <p className="text-center text-xs text-slate-400">Demo: admin@helpdesk.lk / admin123</p>
      </form>
    </div>
  );
}

function AdminShell() {
  const { user, logout, api } = useAuth();
  const [section, setSection] = useState<Section>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = useUnreadCount();
  const stats = useLiveData(() => api.admin.dashboard());
  const badges: Partial<Record<Section, number>> = {
    verification: stats.data?.stats.pendingVerifications,
    complaints: stats.data?.stats.openComplaints,
  };

  const resetDemo = async () => {
    if (window.confirm('Reset all data to the demo seed? Everything created since will be lost.')) await api.admin.resetDemo();
  };

  return (
    <div className="flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="rounded-2xl bg-slate-900 p-3 text-white lg:sticky lg:top-20">
          <div className="flex items-center gap-2 px-2 pt-1 pb-3">
            <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: user!.avatarColor }} aria-hidden>
              {initials(user!.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user!.fullName}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin sections">
            {SECTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                aria-current={section === value ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${section === value ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Icon size={16} /> {label}
                {!!badges[value] && <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-900">{badges[value]}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-3 flex gap-1 border-t border-white/10 pt-3 lg:flex-col">
            <button type="button" onClick={() => setShowNotifications(true)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white">
              <Bell size={16} /> Notifications {unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
            </button>
            <button type="button" onClick={resetDemo} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white">
              <RotateCcw size={16} /> Reset demo data
            </button>
            <button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white">
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl">
        {section === 'overview' && <Overview onGo={setSection} />}
        {section === 'verification' && <Verification />}
        {section === 'bookings' && <Bookings />}
        {section === 'users' && <UsersSection />}
        {section === 'complaints' && <Complaints />}
        {section === 'pricing' && <Pricing />}
        {section === 'audit' && <Audit />}
        <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    </div>
  );
}

// ---------- Shared bits ----------

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-16 text-slate-400">
      <Loader2 className="animate-spin" />
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-sky-100 text-sky-800',
  ON_THE_WAY: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-violet-100 text-violet-800',
  AWAITING_CUSTOMER_CONFIRMATION: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const STATUS_BAR: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-400',
  ACCEPTED: 'bg-sky-500',
  ON_THE_WAY: 'bg-indigo-500',
  IN_PROGRESS: 'bg-violet-500',
  AWAITING_CUSTOMER_CONFIRMATION: 'bg-orange-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-slate-400',
};

// ---------- Overview ----------

function Overview({ onGo }: { onGo: (section: Section) => void }) {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.dashboard());
  if (!data) return <Loading />;
  const s = data.stats;
  const totalBookings = Object.values(s.bookingsByStatus).reduce((a, b) => a + b, 0);
  const maxCategory = Math.max(1, ...s.bookingsByCategory.map((c) => c.count));

  const tiles: { label: string; value: string; hint: string; go?: Section }[] = [
    { label: 'Gross booking value', value: formatLkr(s.grossBookingValue), hint: `${s.completedBookings} completed jobs` },
    { label: 'Platform revenue', value: formatLkr(s.platformRevenue), hint: '10% commission' },
    { label: 'Active bookings', value: String(s.activeBookings), hint: `${s.cancelledBookings} cancelled overall`, go: 'bookings' },
    { label: 'Pending verifications', value: String(s.pendingVerifications), hint: `${s.totalProviders} providers`, go: 'verification' },
    { label: 'Open complaints', value: String(s.openComplaints), hint: 'Open or under review', go: 'complaints' },
    { label: 'Users', value: String(s.totalUsers), hint: `${s.totalCustomers} customers`, go: 'users' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            disabled={!t.go}
            onClick={() => t.go && onGo(t.go)}
            className="rounded-2xl bg-white p-4 text-left shadow-sm enabled:hover:ring-2 enabled:hover:ring-brand-200"
          >
            <p className="text-xs font-medium text-slate-500">{t.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{t.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{t.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Bookings by status">
          {totalBookings === 0 ? (
            <Empty>No bookings yet.</Empty>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Share of bookings by status">
                {(Object.keys(s.bookingsByStatus) as BookingStatus[])
                  .filter((k) => s.bookingsByStatus[k] > 0)
                  .map((k) => (
                    <span key={k} className={`${STATUS_BAR[k]} border-r-2 border-white last:border-0`} style={{ width: `${(s.bookingsByStatus[k] / totalBookings) * 100}%` }} />
                  ))}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {(Object.keys(s.bookingsByStatus) as BookingStatus[]).map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR[k]}`} />
                    <span className="flex-1 text-slate-600">{BOOKING_STATUS_LABELS[k]}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{s.bookingsByStatus[k]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
        <Panel title="Bookings by service">
          {s.bookingsByCategory.length === 0 ? (
            <Empty>No bookings yet.</Empty>
          ) : (
            <ul className="space-y-2.5">
              {s.bookingsByCategory.map((c) => (
                <li key={c.categoryId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{c.name}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ---------- Verification ----------

function Verification() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.verifications());
  if (!data) return <Loading />;
  const pending = data.providers.filter((p) => p.status === 'PENDING_VERIFICATION');
  const others = data.providers.filter((p) => p.status !== 'PENDING_VERIFICATION');

  return (
    <div className="space-y-4">
      <Panel title={`Waiting for review (${pending.length})`}>
        {pending.length === 0 ? <Empty>Nothing to review. 🎉</Empty> : <div className="space-y-3">{pending.map((p) => <VerificationCard key={p.userId} provider={p} />)}</div>}
      </Panel>
      <Panel title="All providers">
        <div className="space-y-3">
          {others.map((p) => (
            <VerificationCard key={p.userId} provider={p} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function VerificationCard({ provider: p }: { provider: VerificationRequest }) {
  const { api } = useAuth();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    setBusy(status);
    setError(null);
    try {
      await api.admin.setVerification(p.userId, status, note || undefined);
      setNote('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? (err.fieldError('note') ?? err.message) : (err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const statusColor = { APPROVED: 'bg-green-100 text-green-800', PENDING_VERIFICATION: 'bg-amber-100 text-amber-800', REJECTED: 'bg-red-100 text-red-800', SUSPENDED: 'bg-slate-200 text-slate-700', NOT_SUBMITTED: 'bg-slate-100 text-slate-500' }[p.status];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.avatarColor }} aria-hidden>
          {initials(p.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{p.fullName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColor}`}>{p.status.replace('_', ' ').toLowerCase()}</span>
          </div>
          <p className="text-xs text-slate-500">
            {p.email} · {p.phone} · {p.city}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">NIC</dt>
              <dd className="font-mono text-slate-700">{p.nicNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Trades</dt>
              <dd className="text-slate-700">{p.categoryNames.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Experience</dt>
              <dd className="text-slate-700">{p.yearsOfExperience} years</dd>
            </div>
            <div>
              <dt className="text-slate-400">Submitted</dt>
              <dd className="text-slate-700">{p.submittedAt ? formatDateTime(p.submittedAt) : '—'}</dd>
            </div>
          </dl>
          {p.bio && <p className="mt-2 text-sm text-slate-600">{p.bio}</p>}
          {p.verificationNote && <p className="mt-2 text-xs text-slate-500">Note: {p.verificationNote}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to provider (required to reject)" className="min-w-48 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" aria-label={`Note to ${p.fullName}`} />
        {p.status !== 'APPROVED' && (
          <ActionButton size="sm" variant="provider" loading={busy === 'APPROVED'} disabled={!!busy} onClick={() => decide('APPROVED')}>
            Approve
          </ActionButton>
        )}
        {p.status === 'PENDING_VERIFICATION' && (
          <ActionButton size="sm" variant="danger" loading={busy === 'REJECTED'} disabled={!!busy} onClick={() => decide('REJECTED')}>
            Reject
          </ActionButton>
        )}
        {p.status === 'APPROVED' && (
          <ActionButton size="sm" variant="danger" loading={busy === 'SUSPENDED'} disabled={!!busy} onClick={() => decide('SUSPENDED')}>
            Suspend
          </ActionButton>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------- Bookings ----------

function Bookings() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.bookings());
  const [filter, setFilter] = useState<'all' | 'active' | BookingStatus>('all');
  if (!data) return <Loading />;
  const rows = data.bookings.filter((b) => (filter === 'all' ? true : filter === 'active' ? ACTIVE_BOOKING_STATUSES.includes(b.status) : b.status === filter));

  const cancel = async (id: number) => {
    const reason = window.prompt('Reason for cancelling (shown to customer and provider):');
    if (reason === null) return;
    try {
      await api.bookings.cancel(id, reason || 'Cancelled by HelpDesk support');
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <Panel
      title={`Bookings (${rows.length})`}
      action={
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" aria-label="Filter bookings">
          <option value="all">All</option>
          <option value="active">Active</option>
          {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      }
    >
      {rows.length === 0 ? (
        <Empty>No bookings match.</Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-2 font-medium">#</th>
                <th className="py-2 font-medium">Job</th>
                <th className="py-2 font-medium">Customer</th>
                <th className="py-2 font-medium">Provider</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="px-5 py-2 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 text-slate-400 tabular-nums">{b.id}</td>
                  <td className="py-2.5">
                    <p className="font-medium text-slate-800">{b.title}</p>
                    <p className="text-xs text-slate-400">
                      {b.categoryName} · {b.city}
                      {b.urgency === 'URGENT' && <span className="ml-1 font-semibold text-red-600">urgent</span>}
                    </p>
                  </td>
                  <td className="py-2.5 text-slate-600">{b.customerName}</td>
                  <td className="py-2.5 text-slate-600">{b.providerName ?? <span className="text-slate-400">—</span>}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${STATUS_COLORS[b.status]}`}>{BOOKING_STATUS_LABELS[b.status]}</span>
                  </td>
                  <td className="py-2.5 text-right text-slate-700 tabular-nums">{formatLkr(b.finalCost ?? b.estimatedCost)}</td>
                  <td className="px-5 py-2.5 text-right text-xs text-slate-400">
                    {timeAgo(b.updatedAt)}
                    {['PENDING', 'ACCEPTED', 'ON_THE_WAY'].includes(b.status) && (
                      <button type="button" onClick={() => cancel(b.id)} className="ml-2 font-medium text-red-600 hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ---------- Users ----------

function UsersSection() {
  const { api, user: me } = useAuth();
  const { data } = useLiveData(() => api.admin.users());
  const [query, setQuery] = useState('');
  if (!data) return <Loading />;
  const q = query.toLowerCase();
  const rows = data.users.filter((u) => !q || u.fullName.toLowerCase().includes(q) || u.email.includes(q));

  return (
    <Panel
      title={`Users (${rows.length})`}
      action={<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" aria-label="Search users" />}
    >
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Bookings</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="px-5 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-2.5">
                  <p className="font-medium text-slate-800">{u.fullName}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="py-2.5 text-slate-600">
                  {u.role.toLowerCase()}
                  {u.providerStatus && u.providerStatus !== 'APPROVED' && <span className="ml-1 text-xs text-amber-700">({u.providerStatus.replace('_', ' ').toLowerCase()})</span>}
                </td>
                <td className="py-2.5 text-slate-600 tabular-nums">{u.bookingCount}</td>
                <td className="py-2.5 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-LK')}</td>
                <td className="px-5 py-2.5 text-right">
                  {u.id === me!.id ? (
                    <span className="text-xs text-slate-400">You</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => api.admin.setUserActive(u.id, !u.isActive)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800'}`}
                      title={u.isActive ? 'Click to deactivate' : 'Click to reactivate'}
                    >
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ---------- Complaints ----------

function Complaints() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.complaints());
  if (!data) return <Loading />;
  return (
    <Panel title={`Complaints (${data.complaints.length})`}>
      {data.complaints.length === 0 ? <Empty>No complaints. 🎉</Empty> : <div className="space-y-3">{data.complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}</div>}
    </Panel>
  );
}

function ComplaintCard({ complaint: c }: { complaint: AdminComplaintRow }) {
  const { api } = useAuth();
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const closed = c.status === 'RESOLVED' || c.status === 'DISMISSED';

  const update = async (status: 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED') => {
    setError(null);
    try {
      await api.admin.updateComplaint(c.id, status, resolution || undefined);
      setResolution('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? (err.fieldError('resolution') ?? err.message) : (err as Error).message);
    }
  };

  const color = { OPEN: 'bg-red-100 text-red-800', UNDER_REVIEW: 'bg-amber-100 text-amber-800', RESOLVED: 'bg-green-100 text-green-800', DISMISSED: 'bg-slate-100 text-slate-600' }[c.status];

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-slate-900">{c.reason}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>{c.status.replace('_', ' ').toLowerCase()}</span>
        <span className="ml-auto text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {c.raisedByName} · booking #{c.serviceRequestId} “{c.bookingTitle}”
      </p>
      <p className="mt-2 text-sm text-slate-700">{c.description}</p>
      {c.resolution && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">Resolution: {c.resolution}</p>}
      {!closed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution (e.g. refunded LKR 1,500)" className="min-w-48 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" aria-label="Resolution" />
          {c.status === 'OPEN' && (
            <ActionButton size="sm" variant="secondary" onClick={() => update('UNDER_REVIEW')}>
              Start review
            </ActionButton>
          )}
          <ActionButton size="sm" onClick={() => update('RESOLVED')}>
            Resolve
          </ActionButton>
          <ActionButton size="sm" variant="ghost" onClick={() => update('DISMISSED')}>
            Dismiss
          </ActionButton>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------- Pricing ----------

function Pricing() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.pricingRules());
  if (!data) return <Loading />;
  return (
    <Panel title="Pricing rules (LKR)">
      <p className="mb-4 text-sm text-slate-500">The visit fee is charged on every booking. Hourly ranges guide providers' quotes and the AI cost estimate.</p>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-2 font-medium">Service</th>
              <th className="py-2 font-medium">Visit fee</th>
              <th className="py-2 font-medium">Min hourly</th>
              <th className="py-2 font-medium">Max hourly</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {data.pricingRules.map((r) => (
              <PricingRow key={r.id} rule={r} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PricingRow({ rule }: { rule: PricingRule & { categoryName: string } }) {
  const { api } = useAuth();
  const [form, setForm] = useState({ baseFee: String(rule.baseFee), minHourlyRate: String(rule.minHourlyRate), maxHourlyRate: String(rule.maxHourlyRate) });
  const [status, setStatus] = useState<string | null>(null);
  const dirty = form.baseFee !== String(rule.baseFee) || form.minHourlyRate !== String(rule.minHourlyRate) || form.maxHourlyRate !== String(rule.maxHourlyRate);

  const save = async () => {
    setStatus(null);
    try {
      await api.admin.updatePricingRule(rule.id, { baseFee: Number(form.baseFee), minHourlyRate: Number(form.minHourlyRate), maxHourlyRate: Number(form.maxHourlyRate) });
      setStatus('Saved');
    } catch (err) {
      setStatus(err instanceof ApiRequestError ? (err.details[0]?.message ?? err.message) : (err as Error).message);
    }
  };

  const cell = (key: keyof typeof form) => (
    <td className="py-2 pr-2">
      <input type="number" min={0} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums" aria-label={`${rule.categoryName} ${key}`} />
    </td>
  );

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-5 py-2 font-medium text-slate-800">{rule.categoryName}</td>
      {cell('baseFee')}
      {cell('minHourlyRate')}
      {cell('maxHourlyRate')}
      <td className="px-5 py-2 text-right">
        {dirty ? (
          <ActionButton size="sm" onClick={save}>
            Save
          </ActionButton>
        ) : (
          status && <span className="text-xs text-slate-500">{status}</span>
        )}
      </td>
    </tr>
  );
}

// ---------- Audit ----------

function Audit() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.admin.auditLogs());
  if (!data) return <Loading />;
  return (
    <Panel title="Audit log">
      {data.auditLogs.length === 0 ? (
        <Empty>No admin actions recorded yet.</Empty>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.auditLogs.map((l) => (
            <li key={l.id} className="flex items-start gap-3 py-2.5">
              <Activity size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-slate-800">
                  <span className="font-medium">{l.actorName}</span> · <span className="font-mono text-xs">{l.action}</span> · {l.entity} #{l.entityId}
                </p>
                {l.details && <p className="text-xs text-slate-500">{l.details}</p>}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatDateTime(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
