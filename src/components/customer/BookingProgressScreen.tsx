// Customer's view of one booking: status tracker, live map, provider contact, quotes,
// completion confirmation, review and complaints. Also exports the booking chat, which
// the provider app reuses.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, MessageCircle, Phone, ReceiptText, Send, Sparkles, Star, TriangleAlert, X } from 'lucide-react';
import type { BookingDetail } from '../../types';
import { BOOKING_STATUS_LABELS, BOOKING_TRACKER_STEPS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatLkr, initials, timeAgo, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';
import { CategoryIcon } from '../common/CategoryIcons';
import NavigationHeader from '../common/NavigationHeader';
import LiveServiceTracker from './LiveServiceTracker';
import { FullScreenLoader } from './CustomerApp';

export default function BookingProgressScreen({ bookingId, onBack }: { bookingId: number; onBack: () => void }) {
  const { api, user } = useAuth();
  const { data, error } = useLiveData(() => api.bookings.get(bookingId), [bookingId]);
  const [view, setView] = useState<'details' | 'chat' | 'complaint'>('details');

  if (error) return <NavigationHeader title={error} onBack={onBack} />;
  if (!data) return <FullScreenLoader />;
  const booking = data.booking;

  if (view === 'chat' && booking.provider) {
    return (
      <BookingChat
        bookingId={booking.id}
        myId={user!.id}
        title={booking.provider.fullName}
        subtitle={booking.title}
        accent="brand"
        readOnly={!['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(booking.status)}
        onBack={() => setView('details')}
      />
    );
  }
  if (view === 'complaint') return <ComplaintForm booking={booking} onDone={() => setView('details')} />;

  return (
    <>
      <NavigationHeader title={booking.title} subtitle={`Booking #${booking.id} · ${booking.category.name}`} onBack={onBack} />
      <div className="phone-scroll flex-1 space-y-4 overflow-y-auto p-4">
        <StatusBanner booking={booking} />
        {['ACCEPTED', 'ON_THE_WAY'].includes(booking.status) && <LiveServiceTracker booking={booking} />}
        {booking.provider && <ProviderContact booking={booking} onChat={() => setView('chat')} />}
        <PendingQuote booking={booking} />
        <ConfirmCompletion booking={booking} />
        {booking.status === 'COMPLETED' && <ReviewSection booking={booking} />}
        <Tracker booking={booking} />
        <JobDetails booking={booking} />
        <Complaints booking={booking} />
        <BookingActions booking={booking} onComplaint={() => setView('complaint')} />
      </div>
    </>
  );
}

function StatusBanner({ booking }: { booking: BookingDetail }) {
  const text: Partial<Record<BookingDetail['status'], string>> = {
    PENDING: booking.requestedProviderId ? 'Waiting for the provider to accept your request.' : `Sent to available ${booking.category.name.toLowerCase()} providers nearby. The first to accept gets the job.`,
    IN_PROGRESS: 'Work is in progress.',
    COMPLETED: `Completed ${booking.completedAt ? formatDateTime(booking.completedAt) : ''}. Total paid ${formatLkr(booking.finalCost)}.`,
    CANCELLED: `Cancelled${booking.cancellationReason ? `: ${booking.cancellationReason}` : '.'}`,
  };
  if (!text[booking.status]) return null;
  const color = booking.status === 'COMPLETED' ? 'bg-green-50 text-green-800' : booking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-900';
  return (
    <div className={`flex items-start gap-3 rounded-2xl p-3 text-sm ${color}`}>
      {booking.status === 'PENDING' && (
        <span className="relative mt-1 flex h-3 w-3 shrink-0">
          <span className="radar-ping absolute inline-flex h-full w-full rounded-full bg-brand-500" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-600" />
        </span>
      )}
      <p>
        <span className="font-semibold">{BOOKING_STATUS_LABELS[booking.status]}. </span>
        {text[booking.status]}
      </p>
    </div>
  );
}

function ProviderContact({ booking, onChat }: { booking: BookingDetail; onChat: () => void }) {
  const p = booking.provider!;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.avatarColor }} aria-hidden>
        {initials(p.fullName)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{p.fullName}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {p.averageRating.toFixed(1)} · {p.yearsOfExperience} yrs
        </p>
      </div>
      {p.phone && (
        <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-green-700 hover:bg-green-100" aria-label={`Call ${p.fullName}`}>
          <Phone size={18} />
        </a>
      )}
      <button type="button" onClick={onChat} className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100" aria-label={`Chat with ${p.fullName}`}>
        <MessageCircle size={18} />
      </button>
    </div>
  );
}

function PendingQuote({ booking }: { booking: BookingDetail }) {
  const { api } = useAuth();
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const quote = booking.costProposals.find((p) => p.status === 'PENDING');
  if (!quote) return null;

  const respond = async (accept: boolean) => {
    setBusy(accept ? 'accept' : 'reject');
    setError(null);
    try {
      await api.bookings.respondCost(booking.id, quote.id, accept);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <ReceiptText size={16} /> New quote from {booking.provider?.fullName.split(' ')[0]}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{formatLkr(quote.amount)}</p>
      <p className="mt-1 text-sm text-slate-700">{quote.note}</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <ActionButton fullWidth loading={busy === 'accept'} disabled={busy !== null} onClick={() => respond(true)} icon={<Check size={16} />}>
          Approve
        </ActionButton>
        <ActionButton variant="secondary" loading={busy === 'reject'} disabled={busy !== null} onClick={() => respond(false)} icon={<X size={16} />}>
          Decline
        </ActionButton>
      </div>
    </div>
  );
}

function ConfirmCompletion({ booking }: { booking: BookingDetail }) {
  const { api } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notDone, setNotDone] = useState(false);
  const [note, setNote] = useState('');
  if (booking.status !== 'AWAITING_CUSTOMER_CONFIRMATION') return null;

  const respond = async (confirmed: boolean) => {
    setBusy(true);
    try {
      await api.bookings.confirmCompletion(booking.id, confirmed, note || undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-2 ring-brand-500">
      <p className="text-sm font-semibold text-slate-900">Is the job done?</p>
      <p className="mt-1 text-sm text-slate-600">{booking.provider?.fullName} has finished and sent the invoice.</p>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
        <span className="text-sm text-slate-600">Amount to pay</span>
        <span className="text-lg font-bold text-slate-900">{formatLkr(booking.finalCost)}</span>
      </div>
      {notDone ? (
        <div className="mt-3 space-y-2">
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What still needs to be done?" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          <div className="flex gap-2">
            <ActionButton fullWidth variant="danger" loading={busy} onClick={() => respond(false)}>
              Send back to provider
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setNotDone(false)}>
              Cancel
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <ActionButton fullWidth loading={busy} onClick={() => respond(true)} icon={<Check size={16} />}>
            Yes, pay & complete
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => setNotDone(true)}>
            Not yet
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function ReviewSection({ booking }: { booking: BookingDetail }) {
  const { api } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (booking.review) {
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <p className="text-sm font-semibold text-slate-800">Your review</p>
        <p className="mt-1 text-amber-500" aria-label={`${booking.review.rating} out of 5 stars`}>
          {'★'.repeat(booking.review.rating)}
          <span className="text-slate-200">{'★'.repeat(5 - booking.review.rating)}</span>
        </p>
        {booking.review.comment && <p className="mt-1 text-sm text-slate-600">{booking.review.comment}</p>}
        {booking.review.providerResponse && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Reply from {booking.provider?.fullName.split(' ')[0]}: {booking.review.providerResponse}</p>}
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Tap a star to rate.');
    setBusy(true);
    setError(null);
    try {
      await api.bookings.review(booking.id, rating, comment);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
      <p className="text-sm font-semibold text-slate-800">How did {booking.provider?.fullName.split(' ')[0]} do?</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1">
            <Star size={28} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
          </button>
        ))}
      </div>
      <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about the job (optional)" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <ActionButton type="submit" fullWidth loading={busy} className="mt-2">
        Submit review
      </ActionButton>
    </form>
  );
}

function Tracker({ booking }: { booking: BookingDetail }) {
  if (booking.status === 'CANCELLED') return null;
  const currentIndex = BOOKING_TRACKER_STEPS.indexOf(booking.status);
  const reachedAt = (step: string) => booking.history.filter((h) => h.toStatus === step).at(-1)?.createdAt;

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="mb-3 text-sm font-semibold text-slate-800">Progress</p>
      <ol className="space-y-0">
        {BOOKING_TRACKER_STEPS.map((step, index) => {
          const done = index < currentIndex || booking.status === 'COMPLETED';
          const current = index === currentIndex && booking.status !== 'COMPLETED';
          const at = reachedAt(step);
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-brand-600 text-white' : current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-slate-100 text-slate-400'}`}>
                  {done ? <Check size={14} /> : index + 1}
                </span>
                {index < BOOKING_TRACKER_STEPS.length - 1 && <span className={`h-6 w-0.5 ${done ? 'bg-brand-600' : 'bg-slate-200'}`} />}
              </div>
              <div className="flex-1 pt-0.5">
                <p className={`text-sm ${current ? 'font-semibold text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step === 'AWAITING_CUSTOMER_CONFIRMATION' ? 'Invoice sent' : BOOKING_STATUS_LABELS[step]}
                </p>
                {at && (done || current) && <p className="text-[11px] text-slate-400">{formatDateTime(at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function JobDetails({ booking }: { booking: BookingDetail }) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <CategoryIcon slug={booking.category.slug} size="sm" />
        <p className="text-sm font-semibold text-slate-800">Job details</p>
        {booking.urgency === 'URGENT' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span>}
      </div>
      <p className="text-sm text-slate-600">{booking.description}</p>
      {booking.aiSummary && (
        <p className="flex gap-2 rounded-xl bg-brand-50 p-2 text-xs text-brand-900">
          <Sparkles size={14} className="mt-px shrink-0" /> {booking.aiSummary}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">Address</dt>
          <dd className="text-slate-700">
            {booking.address}, {booking.city}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Preferred time</dt>
          <dd className="text-slate-700">{booking.preferredDate ? formatDateTime(booking.preferredDate) : 'As soon as possible'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Visit fee</dt>
          <dd className="text-slate-700">{formatLkr(booking.estimatedCost)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Final cost</dt>
          <dd className="text-slate-700">{booking.finalCost !== null ? formatLkr(booking.finalCost) : '—'}</dd>
        </div>
      </dl>
      {booking.costProposals.filter((p) => p.status !== 'PENDING').length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <p className="mb-1 text-xs font-medium text-slate-500">Quotes</p>
          {booking.costProposals
            .filter((p) => p.status !== 'PENDING')
            .map((p) => (
              <p key={p.id} className="flex justify-between text-xs text-slate-600">
                <span className="truncate pr-2">{p.note}</span>
                <span className={p.status === 'ACCEPTED' ? 'font-semibold text-green-700' : 'text-slate-400 line-through'}>{formatLkr(p.amount)}</span>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

function Complaints({ booking }: { booking: BookingDetail }) {
  if (booking.complaints.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="mb-2 text-sm font-semibold text-slate-800">Reported problems</p>
      {booking.complaints.map((c) => (
        <div key={c.id} className="border-t border-slate-100 py-2 first:border-0 first:pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">{c.reason}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{c.status.replace('_', ' ')}</span>
          </div>
          {c.resolution && <p className="mt-1 text-xs text-slate-500">Support: {c.resolution}</p>}
        </div>
      ))}
    </div>
  );
}

function BookingActions({ booking, onComplaint }: { booking: BookingDetail; onComplaint: () => void }) {
  const { api } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel = ['PENDING', 'ACCEPTED', 'ON_THE_WAY'].includes(booking.status);
  const canComplain = booking.provider && ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status);
  if (!canCancel && !canComplain) return null;

  const cancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.bookings.cancel(booking.id, reason || undefined);
      setConfirming(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 pb-4">
      {canCancel &&
        (confirming ? (
          <div className="space-y-2 rounded-2xl bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">Cancel this booking?</p>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none" />
            {error && <p className="text-xs text-red-700">{error}</p>}
            <div className="flex gap-2">
              <ActionButton variant="danger" fullWidth loading={busy} onClick={cancel}>
                Yes, cancel
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirming(false)}>
                Keep it
              </ActionButton>
            </div>
          </div>
        ) : (
          <ActionButton variant="ghost" fullWidth onClick={() => setConfirming(true)}>
            Cancel booking
          </ActionButton>
        ))}
      {canComplain && (
        <ActionButton variant="ghost" fullWidth onClick={onComplaint} icon={<TriangleAlert size={16} />}>
          Report a problem
        </ActionButton>
      )}
    </div>
  );
}

function ComplaintForm({ booking, onDone }: { booking: BookingDetail; onDone: () => void }) {
  const { api } = useAuth();
  const reasons = ['Poor quality work', 'Charged more than agreed', 'Provider was late or did not show', 'Damage to property', 'Unprofessional behaviour', 'Other'];
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.bookings.complain(booking.id, reason, description);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <NavigationHeader title="Report a problem" subtitle={booking.title} onBack={onDone} />
      <form onSubmit={submit} className="phone-scroll flex-1 space-y-3 overflow-y-auto p-4">
        <p className="text-sm text-slate-600">Our support team reviews every report, usually within a day.</p>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-slate-600">What went wrong?</legend>
          {reasons.map((r) => (
            <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl bg-white p-3 text-sm ring-1 ${reason === r ? 'ring-2 ring-brand-500' : 'ring-slate-200'}`}>
              <input type="radio" name="reason" className="accent-brand-600" checked={reason === r} onChange={() => setReason(r)} /> {r}
            </label>
          ))}
        </fieldset>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened (at least 10 characters)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <ActionButton type="submit" fullWidth size="lg" loading={busy}>
          Send report
        </ActionButton>
      </form>
    </>
  );
}

// ---------- Chat (used by both apps) ----------

export function BookingChat({
  bookingId,
  myId,
  title,
  subtitle,
  accent,
  readOnly = false,
  onBack,
}: {
  bookingId: number;
  myId: number;
  title: string;
  subtitle: string;
  accent: 'brand' | 'provider';
  readOnly?: boolean;
  onBack: () => void;
}) {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.bookings.messages(bookingId), [bookingId]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];
  const mine = accent === 'provider' ? 'bg-provider-600 text-white' : 'bg-brand-600 text-white';

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    setError(null);
    try {
      await api.bookings.sendMessage(bookingId, body);
    } catch (err) {
      setText(body);
      setError((err as Error).message);
    }
  };

  return (
    <>
      <NavigationHeader title={title} subtitle={subtitle} onBack={onBack} />
      <div className="phone-scroll flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
        {data && messages.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No messages yet. Say hello!</p>}
        {messages.map((m) => {
          const isMine = m.senderId === myId;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${isMine ? `${mine} rounded-br-md` : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100'}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {readOnly ? (
        <p className="border-t border-slate-100 bg-white p-3 text-center text-xs text-slate-400">This booking is closed. Chat is read-only.</p>
      ) : (
        <form onSubmit={send} className="border-t border-slate-100 bg-white p-2">
          {error && <p className="px-2 pb-1 text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" aria-label="Message" className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
            <button type="submit" className={`grid h-10 w-10 place-items-center rounded-full ${mine}`} aria-label="Send">
              <Send size={18} />
            </button>
          </div>
        </form>
      )}
    </>
  );
}
