// Provider (technician) app: job radar, my jobs with the job workflow, earnings and profile.
// Unverified providers only see the verification screen.

import { useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Banknote, Briefcase, Check, Clock, LogOut, MapPin, MessageCircle, Navigation, Phone, Radar, ReceiptText, Star, UserRound, Wrench, X } from 'lucide-react';
import type { BookingDetail } from '../../types';
import { BOOKING_STATUS_LABELS, PLATFORM_COMMISSION_RATE } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatLkr, initials, timeAgo, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';
import { CategoryIcon } from '../common/CategoryIcons';
import NavigationHeader from '../common/NavigationHeader';
import NotificationsModal from '../common/NotificationsModal';
import WelcomeScreen from '../common/WelcomeScreen';
import ProviderMobileHeader from '../mobile/ProviderMobileHeader';
import { BookingChat } from '../customer/BookingProgressScreen';
import { FullScreenLoader } from '../customer/CustomerApp';
import { PasswordSection } from '../customer/CustomerSettings';
import ProviderVerificationPendingScreen from './ProviderVerificationPendingScreen';

type Tab = 'radar' | 'jobs' | 'earnings' | 'profile';
type Screen = { type: 'job'; bookingId: number } | { type: 'chat'; bookingId: number };

export default function ProviderApp() {
  const { user, providerProfile, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <WelcomeScreen app="provider" />;
  if (!providerProfile) return <FullScreenLoader />;
  if (providerProfile.status !== 'APPROVED') return <ProviderVerificationPendingScreen />;
  return <SignedInProviderApp />;
}

function SignedInProviderApp() {
  const { user, refresh } = useAuth();
  // Keep rating, availability and verification status current (e.g. if an admin suspends us).
  useLiveData(() => refresh(), []);
  const [tab, setTab] = useState<Tab>('radar');
  const [stack, setStack] = useState<Screen[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const push = (screen: Screen) => setStack((s) => [...s, screen]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const top = stack.at(-1);

  let screen: ReactNode = null;
  if (top?.type === 'job') screen = <JobScreen bookingId={top.bookingId} onBack={pop} onChat={() => push({ type: 'chat', bookingId: top.bookingId })} />;
  if (top?.type === 'chat') screen = <ProviderChat bookingId={top.bookingId} myId={user!.id} onBack={pop} />;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <AnimatePresence mode="popLayout" initial={false}>
        {screen ? (
          <motion.div key={stack.length} className="absolute inset-0 z-20 flex flex-col bg-slate-50" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.18 }}>
            {screen}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ProviderMobileHeader onNotifications={() => setShowNotifications(true)} />

      <div className="phone-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'radar' && <RadarTab onOpen={(id) => push({ type: 'job', bookingId: id })} />}
        {tab === 'jobs' && <JobsTab onOpen={(id) => push({ type: 'job', bookingId: id })} />}
        {tab === 'earnings' && <EarningsTab />}
        {tab === 'profile' && <ProfileTab />}
      </div>

      <nav className="grid shrink-0 grid-cols-4 border-t border-slate-200 bg-white" aria-label="Provider app">
        {(
          [
            ['radar', 'Radar', Radar],
            ['jobs', 'My jobs', Briefcase],
            ['earnings', 'Earnings', Banknote],
            ['profile', 'Profile', UserRound],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setStack([]);
            }}
            aria-current={tab === value ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${tab === value ? 'text-provider-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>

      <NotificationsModal
        accent="provider"
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpen={(n) => {
          if (n.serviceRequestId) setStack([{ type: 'job', bookingId: n.serviceRequestId }]);
        }}
      />
    </div>
  );
}

// ---------- Radar ----------

function JobCard({ job, onOpen }: { job: BookingDetail; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 hover:ring-provider-500">
      <div className="flex items-start gap-3">
        <CategoryIcon slug={job.category.slug} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-slate-800">{job.title}</p>
            {job.urgency === 'URGENT' && <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">URGENT</span>}
          </div>
          <p className="line-clamp-2 text-xs text-slate-500">{job.description}</p>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <MapPin size={11} /> {job.city}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock size={11} /> {timeAgo(job.createdAt)}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800">{formatLkr(job.estimatedCost)}</p>
          <p className="text-[10px] text-slate-400">visit fee</p>
        </div>
      </div>
      {job.requestedProviderId && <p className="mt-2 rounded-lg bg-provider-50 px-2 py-1 text-[11px] font-semibold text-provider-700">Requested you directly</p>}
    </button>
  );
}

function RadarTab({ onOpen }: { onOpen: (id: number) => void }) {
  const { api, providerProfile } = useAuth();
  const { data } = useLiveData(() => api.provider.availableJobs());
  const jobs = data?.bookings ?? [];
  const online = providerProfile?.isAvailable;

  return (
    <div className="space-y-4 p-4">
      <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
        {online && [0, 0.8, 1.6].map((delay) => <span key={delay} className="radar-ping absolute h-32 w-32 rounded-full border-2 border-provider-500" style={{ animationDelay: `${delay}s` }} />)}
        <span className={`relative grid h-14 w-14 place-items-center rounded-full ${online ? 'bg-provider-500' : 'bg-slate-600'} text-white`}>
          <Radar size={26} />
        </span>
        <p className="absolute bottom-2 text-xs text-slate-300">{online ? `Scanning ${providerProfile?.city ?? ''} for jobs…` : 'You are offline. Go online to get new jobs.'}</p>
      </div>
      <h2 className="text-sm font-semibold text-slate-800">Available jobs ({jobs.length})</h2>
      {data && jobs.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-100">No open jobs right now. New requests appear here instantly.</p>}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {jobs.map((job) => (
            <motion.div key={job.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <JobCard job={job} onOpen={() => onOpen(job.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- My jobs ----------

function JobsTab({ onOpen }: { onOpen: (id: number) => void }) {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.bookings.list());
  if (!data) return <FullScreenLoader />;
  const active = data.bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const past = data.bookings.filter((b) => ['COMPLETED', 'CANCELLED'].includes(b.status));

  const row = (job: BookingDetail) => (
    <button key={job.id} type="button" onClick={() => onOpen(job.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 hover:ring-provider-500">
      <CategoryIcon slug={job.category.slug} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800">{job.title}</span>
        <span className="block truncate text-xs text-slate-500">
          {job.customer.fullName} · {job.city}
        </span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : job.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-provider-100 text-provider-700'}`}>
        {job.status === 'AWAITING_CUSTOMER_CONFIRMATION' ? 'Awaiting customer' : BOOKING_STATUS_LABELS[job.status]}
      </span>
    </button>
  );

  return (
    <div className="space-y-5 p-4">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Active ({active.length})</h2>
        {active.length === 0 && <p className="text-sm text-slate-500">No active jobs. Accept one from the radar.</p>}
        <div className="space-y-2">{active.map(row)}</div>
      </section>
      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">History</h2>
          <div className="space-y-2">{past.map(row)}</div>
        </section>
      )}
    </div>
  );
}

// ---------- Job detail & workflow ----------

function JobScreen({ bookingId, onBack, onChat }: { bookingId: number; onBack: () => void; onChat: () => void }) {
  const { api, user } = useAuth();
  const { data, error } = useLiveData(() => api.bookings.get(bookingId), [bookingId]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) return <NavigationHeader title="Job no longer available" subtitle={error} onBack={onBack} />;
  if (!data) return <FullScreenLoader />;
  const job = data.booking;
  const isMine = job.providerId === user!.id;
  const taken = job.status !== 'PENDING' && !isMine;

  const run = async (name: string, action: () => Promise<unknown>) => {
    setBusy(name);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <NavigationHeader title={job.title} subtitle={`Job #${job.id} · ${job.category.name}`} onBack={onBack} />
      <div className="phone-scroll flex-1 space-y-4 overflow-y-auto p-4">
        {taken && <p className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">Another provider already accepted this job.</p>}

        <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-provider-100 px-2 py-0.5 text-[11px] font-semibold text-provider-700">{BOOKING_STATUS_LABELS[job.status]}</span>
            {job.urgency === 'URGENT' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">URGENT</span>}
          </div>
          <p className="text-sm text-slate-700">{job.description}</p>
          {job.aiSummary && <p className="rounded-xl bg-slate-50 p-2 text-xs text-slate-600">AI note: {job.aiSummary}</p>}
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-slate-400">Location</dt>
              <dd className="text-slate-700">{isMine ? `${job.address}, ${job.city}` : `${job.city} (full address after accepting)`}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Preferred time</dt>
              <dd className="text-slate-700">{job.preferredDate ? formatDateTime(job.preferredDate) : 'As soon as possible'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Visit fee</dt>
              <dd className="text-slate-700">{formatLkr(job.estimatedCost)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Agreed total</dt>
              <dd className="text-slate-700">{job.finalCost !== null ? formatLkr(job.finalCost) : '—'}</dd>
            </div>
          </dl>
        </div>

        {isMine && (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: job.customer.avatarColor }} aria-hidden>
              {initials(job.customer.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{job.customer.fullName}</p>
              <p className="text-xs text-slate-500">Customer</p>
            </div>
            {job.customer.phone && (
              <a href={`tel:${job.customer.phone.replace(/\s/g, '')}`} className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-green-700" aria-label={`Call ${job.customer.fullName}`}>
                <Phone size={18} />
              </a>
            )}
            <button type="button" onClick={onChat} className="grid h-10 w-10 place-items-center rounded-full bg-provider-50 text-provider-700" aria-label={`Chat with ${job.customer.fullName}`}>
              <MessageCircle size={18} />
            </button>
          </div>
        )}

        {isMine && <QuoteStatus job={job} />}

        {actionError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

        {/* Workflow buttons for each status */}
        {job.status === 'PENDING' && !taken && (
          <div className="space-y-2">
            <ActionButton variant="provider" size="lg" fullWidth loading={busy === 'accept'} onClick={() => run('accept', () => api.provider.accept(job.id))} icon={<Check size={18} />}>
              Accept job
            </ActionButton>
            {job.requestedProviderId === user!.id && (
              <ActionButton variant="ghost" fullWidth loading={busy === 'decline'} onClick={() => run('decline', async () => { await api.provider.decline(job.id); onBack(); })} icon={<X size={16} />}>
                Decline (open to other providers)
              </ActionButton>
            )}
          </div>
        )}
        {isMine && job.status === 'ACCEPTED' && (
          <div className="space-y-2">
            <ActionButton variant="provider" size="lg" fullWidth loading={busy === 'go'} onClick={() => run('go', () => api.provider.setStatus(job.id, 'ON_THE_WAY'))} icon={<Navigation size={18} />}>
              Start journey
            </ActionButton>
            <ProposeCost job={job} />
            <ActionButton variant="ghost" fullWidth loading={busy === 'cancel'} onClick={() => run('cancel', () => api.bookings.cancel(job.id, 'Provider could not attend'))}>
              I can't do this job
            </ActionButton>
          </div>
        )}
        {isMine && job.status === 'ON_THE_WAY' && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 rounded-2xl bg-provider-50 p-3 text-sm text-provider-900">
              <Navigation size={16} /> Navigating to {job.address}, {job.city}. The customer can see you on their map.
            </p>
            <ActionButton variant="provider" size="lg" fullWidth loading={busy === 'start'} onClick={() => run('start', () => api.provider.setStatus(job.id, 'IN_PROGRESS'))} icon={<Wrench size={18} />}>
              I've arrived – start work
            </ActionButton>
          </div>
        )}
        {isMine && job.status === 'IN_PROGRESS' && <InProgressActions job={job} />}
        {isMine && job.status === 'AWAITING_CUSTOMER_CONFIRMATION' && (
          <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Invoice of {formatLkr(job.finalCost)} sent. Waiting for {job.customer.fullName.split(' ')[0]} to confirm the job is done.</p>
        )}
        {isMine && job.status === 'COMPLETED' && (
          <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">Job completed</p>
            <p className="mt-1">
              You earned {formatLkr(Math.round((job.finalCost ?? 0) * (1 - PLATFORM_COMMISSION_RATE)))} after the {PLATFORM_COMMISSION_RATE * 100}% platform fee.
            </p>
            {job.review && (
              <p className="mt-2">
                {'★'.repeat(job.review.rating)} {job.review.comment && `“${job.review.comment}”`}
              </p>
            )}
          </div>
        )}
        {job.status === 'CANCELLED' && <p className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">Cancelled{job.cancellationReason ? `: ${job.cancellationReason}` : '.'}</p>}
      </div>
    </>
  );
}

function QuoteStatus({ job }: { job: BookingDetail }) {
  if (job.costProposals.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <ReceiptText size={14} /> Your quotes
      </p>
      {job.costProposals.map((p) => (
        <p key={p.id} className="flex items-center justify-between py-0.5 text-sm">
          <span className="truncate pr-2 text-slate-700">{p.note}</span>
          <span className="flex items-center gap-2">
            <span className="font-semibold">{formatLkr(p.amount)}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${p.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
              {p.status === 'PENDING' ? 'Waiting' : p.status.toLowerCase()}
            </span>
          </span>
        </p>
      ))}
    </div>
  );
}

function ProposeCost({ job }: { job: BookingDetail }) {
  const { api } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const waiting = job.costProposals.some((p) => p.status === 'PENDING');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.provider.proposeCost(job.id, Number(amount), note);
      setOpen(false);
      setAmount('');
      setNote('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <ActionButton variant="secondary" fullWidth disabled={waiting} onClick={() => setOpen(true)} icon={<ReceiptText size={16} />}>
        {waiting ? 'Quote sent – waiting for customer' : 'Send a quote for parts & labour'}
      </ActionButton>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-800">New quote</p>
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-provider-500">
        <span className="text-sm text-slate-500">LKR</span>
        <input type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Total amount" className="w-full text-sm outline-none" aria-label="Total amount in LKR" />
      </label>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What it covers, e.g. new P-trap + 2 hours labour" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-provider-500" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <ActionButton type="submit" variant="provider" fullWidth loading={busy}>
          Send quote
        </ActionButton>
        <ActionButton variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </ActionButton>
      </div>
    </form>
  );
}

function InProgressActions({ job }: { job: BookingDetail }) {
  const { api } = useAuth();
  const accepted = job.costProposals.filter((p) => p.status === 'ACCEPTED').at(-1);
  const waiting = job.costProposals.some((p) => p.status === 'PENDING');
  const [amount, setAmount] = useState(String(accepted?.amount ?? job.finalCost ?? job.estimatedCost));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.provider.setStatus(job.id, 'AWAITING_CUSTOMER_CONFIRMATION', Number(amount));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <ProposeCost job={job} />
      <div className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-slate-800">Finish & send invoice</p>
        {accepted ? (
          <p className="text-sm text-slate-600">
            Invoice total: <span className="font-semibold">{formatLkr(accepted.amount)}</span> (approved quote)
          </p>
        ) : (
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-500">LKR</span>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full text-sm outline-none" aria-label="Invoice total in LKR" />
          </label>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <ActionButton variant="provider" size="lg" fullWidth loading={busy} disabled={waiting} onClick={submit} icon={<Check size={18} />}>
          {waiting ? 'Waiting for quote answer' : 'Job done – send invoice'}
        </ActionButton>
      </div>
    </div>
  );
}

function ProviderChat({ bookingId, myId, onBack }: { bookingId: number; myId: number; onBack: () => void }) {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.bookings.get(bookingId), [bookingId]);
  if (!data) return <FullScreenLoader />;
  const job = data.booking;
  return (
    <BookingChat
      bookingId={bookingId}
      myId={myId}
      title={job.customer.fullName}
      subtitle={job.title}
      accent="provider"
      readOnly={['COMPLETED', 'CANCELLED'].includes(job.status)}
      onBack={onBack}
    />
  );
}

// ---------- Earnings ----------

function EarningsTab() {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.provider.earnings());
  if (!data) return <FullScreenLoader />;
  const e = data.earnings;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl bg-gradient-to-br from-provider-600 to-provider-900 p-5 text-white">
        <p className="text-sm text-white/70">Total earned (after fees)</p>
        <p className="mt-1 text-3xl font-extrabold">{formatLkr(e.netEarnings)}</p>
        <p className="mt-2 text-sm text-white/80">This week: {formatLkr(e.thisWeekNet)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Jobs', String(e.completedJobs)],
          ['Gross', formatLkr(e.grossEarnings)],
          [`Fees (${PLATFORM_COMMISSION_RATE * 100}%)`, formatLkr(e.commission)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Recent payouts</h2>
        {e.recent.length === 0 && <p className="text-sm text-slate-500">Completed jobs will show up here.</p>}
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-100">
          {e.recent.map((r) => (
            <li key={r.serviceRequestId} className="flex items-center justify-between p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800">{r.title}</span>
                <span className="block text-xs text-slate-400">{formatDateTime(r.completedAt)}</span>
              </span>
              <span className="text-sm font-semibold text-provider-700">+{formatLkr(r.net)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Profile ----------

function ProfileTab() {
  const { api, user, providerProfile, refresh, logout } = useAuth();
  const catalog = useLiveData(() => api.catalog.categories());
  const reviews = useLiveData(() => api.provider.reviews());
  const [form, setForm] = useState({
    bio: providerProfile!.bio,
    hourlyRate: String(providerProfile!.hourlyRate),
    city: providerProfile!.city,
    categoryIds: providerProfile!.categoryIds,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await api.provider.update({ bio: form.bio, hourlyRate: Number(form.hourlyRate), city: form.city, categoryIds: form.categoryIds });
      await refresh();
      setStatus('Saved');
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-provider-500';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white" style={{ background: user!.avatarColor }} aria-hidden>
          {initials(user!.fullName)}
        </span>
        <div>
          <p className="font-bold text-slate-900">{user!.fullName}</p>
          <p className="text-xs text-slate-500">{user!.email}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-provider-700">✓ Verified provider</p>
        </div>
      </div>

      <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Business profile</h3>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">About you</span>
          <textarea rows={3} className={input} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Hourly rate (LKR)</span>
            <input type="number" min={0} className={input} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Base city</span>
            <input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
        </div>
        <fieldset>
          <legend className="mb-1 text-xs text-slate-500">Services you offer</legend>
          <div className="flex flex-wrap gap-1.5">
            {catalog.data?.categories.map((c) => {
              const on = form.categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setForm({ ...form, categoryIds: on ? form.categoryIds.filter((id) => id !== c.id) : [...form.categoryIds, c.id] })}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${on ? 'bg-provider-600 text-white ring-provider-600' : 'bg-white text-slate-600 ring-slate-200'}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="flex items-center gap-3">
          <ActionButton type="submit" variant="provider" size="sm" loading={busy}>
            Save profile
          </ActionButton>
          {status && <span className="text-xs text-slate-500">{status}</span>}
        </div>
      </form>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Star size={16} className="fill-amber-400 text-amber-400" /> {providerProfile!.averageRating.toFixed(1)} · {providerProfile!.totalReviews} reviews
        </h3>
        {reviews.data?.reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
        <div className="space-y-3">
          {reviews.data?.reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
        </div>
      </section>

      <PasswordSection />
      <ActionButton variant="danger" fullWidth onClick={logout} icon={<LogOut size={16} />}>
        Log out
      </ActionButton>
    </div>
  );
}

function ReviewItem({ review }: { review: { id: number; rating: number; comment: string; customerName: string; providerResponse: string | null; createdAt: string } }) {
  const { api } = useAuth();
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (reply.trim().length < 2) return;
    await api.provider.respondToReview(review.id, reply);
    setOpen(false);
  };

  return (
    <div className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">{review.customerName}</p>
        <p className="text-xs text-amber-500">{'★'.repeat(review.rating)}</p>
      </div>
      {review.comment && <p className="mt-0.5 text-sm text-slate-600">{review.comment}</p>}
      {review.providerResponse ? (
        <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Your reply: {review.providerResponse}</p>
      ) : open ? (
        <form onSubmit={send} className="mt-2 flex gap-2">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank the customer…" className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none" aria-label="Reply" />
          <ActionButton type="submit" size="sm" variant="provider">
            Reply
          </ActionButton>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-provider-700">
          Reply
        </button>
      )}
    </div>
  );
}
