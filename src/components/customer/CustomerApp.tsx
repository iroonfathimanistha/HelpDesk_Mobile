// Customer app: home (AI triage + categories), provider browsing, booking form,
// bookings list and settings. Navigation is a simple stack on top of three tabs.

import { useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronRight, ClipboardList, Home, Loader2, MapPin, Search, Settings, ShieldAlert, Sparkles, Star, Wand2 } from 'lucide-react';
import type { AiClassification, BookingDetail, Category, ProviderSummary, Urgency } from '../../types';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS_LABELS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError, formatLkr, initials, timeAgo, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';
import { CategoryIcon } from '../common/CategoryIcons';
import NavigationHeader from '../common/NavigationHeader';
import NotificationsModal from '../common/NotificationsModal';
import WelcomeScreen from '../common/WelcomeScreen';
import CustomerMobileHeader from '../mobile/CustomerMobileHeader';
import BookingProgressScreen from './BookingProgressScreen';
import CustomerSettings from './CustomerSettings';

type Tab = 'home' | 'bookings' | 'settings';

interface BookingPrefill {
  title?: string;
  description?: string;
  urgency?: Urgency;
  aiSummary?: string;
}

type Screen =
  | { type: 'category'; categoryId: number }
  | { type: 'provider'; providerId: number; categoryId: number }
  | { type: 'book'; categoryId: number; providerId?: number; prefill?: BookingPrefill }
  | { type: 'booking'; bookingId: number };

export default function CustomerApp() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <WelcomeScreen app="customer" />;
  return <SignedInCustomerApp />;
}

export function FullScreenLoader() {
  return (
    <div className="grid h-full place-items-center text-slate-400">
      <Loader2 className="animate-spin" />
    </div>
  );
}

function SignedInCustomerApp() {
  const { api, user } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [stack, setStack] = useState<Screen[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const catalog = useLiveData(() => api.catalog.categories(), [user?.id]);
  const addresses = useLiveData(() => api.users.addresses(), [user?.id]);

  const push = (screen: Screen) => setStack((s) => [...s, screen]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const top = stack.at(-1);
  const categories = catalog.data?.categories ?? [];
  const categoryById = (id: number) => categories.find((c) => c.id === id);
  const defaultAddress = addresses.data?.addresses.find((a) => a.isDefault) ?? addresses.data?.addresses[0];

  let screen: ReactNode = null;
  if (top?.type === 'category' && categoryById(top.categoryId)) {
    screen = (
      <CategoryScreen
        category={categoryById(top.categoryId)!}
        baseFee={catalog.data?.pricingRules.find((r) => r.categoryId === top.categoryId)?.baseFee}
        onBack={pop}
        onProvider={(providerId) => push({ type: 'provider', providerId, categoryId: top.categoryId })}
        onBookAny={() => push({ type: 'book', categoryId: top.categoryId })}
      />
    );
  } else if (top?.type === 'provider') {
    screen = <ProviderDetailScreen providerId={top.providerId} onBack={pop} onBook={() => push({ type: 'book', categoryId: top.categoryId, providerId: top.providerId })} />;
  } else if (top?.type === 'book' && categoryById(top.categoryId)) {
    screen = (
      <BookingFormScreen
        category={categoryById(top.categoryId)!}
        providerId={top.providerId}
        prefill={top.prefill}
        baseFee={catalog.data?.pricingRules.find((r) => r.categoryId === top.categoryId)?.baseFee ?? 0}
        onBack={pop}
        onBooked={(bookingId) => {
          setTab('bookings');
          setStack([{ type: 'booking', bookingId }]);
        }}
      />
    );
  } else if (top?.type === 'booking') {
    screen = <BookingProgressScreen bookingId={top.bookingId} onBack={pop} />;
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <AnimatePresence mode="popLayout" initial={false}>
        {screen ? (
          <motion.div key={stack.length} className="absolute inset-0 z-20 flex flex-col bg-slate-50" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.18 }}>
            {screen}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {tab !== 'settings' && <CustomerMobileHeader city={defaultAddress?.city} onNotifications={() => setShowNotifications(true)} onProfile={() => setTab('settings')} />}

      <div className="phone-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'home' && (
          <HomeTab
            categories={categories}
            onCategory={(categoryId) => push({ type: 'category', categoryId })}
            onBook={(categoryId, prefill) => push({ type: 'book', categoryId, prefill })}
            onBooking={(bookingId) => push({ type: 'booking', bookingId })}
          />
        )}
        {tab === 'bookings' && <BookingsTab onOpen={(bookingId) => push({ type: 'booking', bookingId })} onHome={() => setTab('home')} />}
        {tab === 'settings' && <CustomerSettings />}
      </div>

      <nav className="grid shrink-0 grid-cols-3 border-t border-slate-200 bg-white" aria-label="Customer app">
        {(
          [
            ['home', 'Home', Home],
            ['bookings', 'Bookings', ClipboardList],
            ['settings', 'Account', Settings],
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
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${tab === value ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>

      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpen={(n) => {
          if (n.serviceRequestId) {
            setTab('bookings');
            setStack([{ type: 'booking', bookingId: n.serviceRequestId }]);
          }
        }}
      />
    </div>
  );
}

// ---------- Home ----------

function HomeTab({
  categories,
  onCategory,
  onBook,
  onBooking,
}: {
  categories: Category[];
  onCategory: (categoryId: number) => void;
  onBook: (categoryId: number, prefill: BookingPrefill) => void;
  onBooking: (bookingId: number) => void;
}) {
  const { api } = useAuth();
  const bookings = useLiveData(() => api.bookings.list());
  const active = bookings.data?.bookings.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)) ?? [];
  const [description, setDescription] = useState('');
  const [triage, setTriage] = useState<{ classification: AiClassification; categoryId: number } | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  const runTriage = async (e: FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) return setTriageError('Tell us a little more about the problem.');
    setThinking(true);
    setTriageError(null);
    try {
      setTriage(await api.ai.classify(description));
    } catch (err) {
      setTriageError((err as Error).message);
    } finally {
      setThinking(false);
    }
  };

  const triageCategory = triage ? categories.find((c) => c.id === triage.categoryId) : undefined;

  return (
    <div className="space-y-5 pb-6">
      <form onSubmit={runTriage} className="-mt-0 bg-brand-600 px-4 pb-5">
        <label htmlFor="triage" className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
          <Wand2 size={16} /> What needs fixing?
        </label>
        <div className="rounded-2xl bg-white p-2 shadow-lg">
          <textarea
            id="triage"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Water is leaking under my kitchen sink"
            className="w-full resize-none px-2 py-1 text-sm outline-none"
          />
          <div className="flex items-center justify-between">
            <span className="px-2 text-[11px] text-slate-400">AI finds the right trade for you</span>
            <ActionButton type="submit" size="sm" loading={thinking} icon={<Search size={14} />}>
              Find help
            </ActionButton>
          </div>
        </div>
        {triageError && <p className="mt-2 text-xs text-white">{triageError}</p>}
      </form>

      <AnimatePresence>
        {triage && triageCategory && (
          <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100" aria-live="polite">
            <div className="flex items-start gap-3">
              <CategoryIcon slug={triageCategory.slug} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{triageCategory.name}</p>
                  {triage.classification.urgency === 'URGENT' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span>}
                </div>
                <p className="mt-0.5 text-sm text-slate-600">{triage.classification.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Typical cost {formatLkr(triage.classification.estimatedCostRange.min)} – {formatLkr(triage.classification.estimatedCostRange.max)}
                </p>
              </div>
            </div>
            {triage.classification.safetyTips.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                {triage.classification.safetyTips.map((tip) => (
                  <li key={tip} className="flex gap-1.5">
                    <ShieldAlert size={14} className="mt-px shrink-0" /> {tip}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <ActionButton
                fullWidth
                onClick={() =>
                  onBook(triage.categoryId, {
                    title: triage.classification.title,
                    description,
                    urgency: triage.classification.urgency,
                    aiSummary: triage.classification.summary,
                  })
                }
              >
                Book {triageCategory.name.toLowerCase()}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => onCategory(triage.categoryId)}>
                See providers
              </ActionButton>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
              <Sparkles size={10} /> {triage.classification.source === 'gemini' ? 'Suggested by Gemini' : 'Suggested by keyword match (AI key not set)'}
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {active.length > 0 && (
        <section className="px-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Active bookings</h2>
          <div className="space-y-2">
            {active.map((b) => (
              <BookingRow key={b.id} booking={b} onOpen={() => onBooking(b.id)} />
            ))}
          </div>
        </section>
      )}

      <section className="px-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Services</h2>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => onCategory(c.id)} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-1 py-3 text-center ring-1 ring-slate-100 hover:ring-brand-200">
              <CategoryIcon slug={c.slug} />
              <span className="text-[11px] leading-tight font-medium text-slate-700">{c.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ booking }: { booking: BookingDetail }) {
  const colors =
    booking.status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : booking.status === 'CANCELLED'
        ? 'bg-slate-100 text-slate-500'
        : booking.status === 'AWAITING_CUSTOMER_CONFIRMATION'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-brand-100 text-brand-700';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${colors}`}>{BOOKING_STATUS_LABELS[booking.status]}</span>;
}

function BookingRow({ booking, onOpen }: { booking: BookingDetail; onOpen: () => void }) {
  const pendingQuote = booking.costProposals.some((p) => p.status === 'PENDING');
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 hover:ring-brand-200">
      <CategoryIcon slug={booking.category.slug} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800">{booking.title}</span>
        <span className="block truncate text-xs text-slate-500">
          {booking.provider ? booking.provider.fullName : 'Looking for a provider'} · {timeAgo(booking.updatedAt)}
        </span>
        {pendingQuote && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Quote waiting for you</span>}
      </span>
      <StatusPill booking={booking} />
    </button>
  );
}

// ---------- Bookings tab ----------

function BookingsTab({ onOpen, onHome }: { onOpen: (bookingId: number) => void; onHome: () => void }) {
  const { api } = useAuth();
  const { data, error } = useLiveData(() => api.bookings.list());
  if (error) return <p className="p-4 text-sm text-red-600">{error}</p>;
  if (!data) return <FullScreenLoader />;
  const active = data.bookings.filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status));
  const past = data.bookings.filter((b) => !ACTIVE_BOOKING_STATUSES.includes(b.status));

  if (data.bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
        <ClipboardList size={36} className="text-slate-300" />
        <p className="text-sm text-slate-500">No bookings yet. Describe a problem on the home screen to get started.</p>
        <ActionButton onClick={onHome}>Book a service</ActionButton>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {active.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Active</h2>
          <div className="space-y-2">
            {active.map((b) => (
              <BookingRow key={b.id} booking={b} onOpen={() => onOpen(b.id)} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Past</h2>
          <div className="space-y-2">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} onOpen={() => onOpen(b.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- Category & providers ----------

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${size === 'lg' ? 'h-16 w-16 text-xl' : 'h-11 w-11 text-sm'}`} style={{ background: color }} aria-hidden>
      {initials(name)}
    </span>
  );
}

function ProviderCard({ provider, onOpen }: { provider: ProviderSummary; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-slate-100 hover:ring-brand-200">
      <Avatar name={provider.fullName} color={provider.avatarColor} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-800">{provider.fullName}</span>
          <span className={`h-2 w-2 shrink-0 rounded-full ${provider.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`} title={provider.isAvailable ? 'Online' : 'Offline'} />
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Star size={12} className="fill-amber-400 text-amber-400" /> {provider.averageRating.toFixed(1)} ({provider.totalReviews}) · {provider.yearsOfExperience} yrs · {provider.city}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-xs font-semibold text-slate-800">{formatLkr(provider.hourlyRate)}</span>
        <span className="block text-[10px] text-slate-400">per hour</span>
      </span>
    </button>
  );
}

function CategoryScreen({
  category,
  baseFee,
  onBack,
  onProvider,
  onBookAny,
}: {
  category: Category;
  baseFee?: number;
  onBack: () => void;
  onProvider: (providerId: number) => void;
  onBookAny: () => void;
}) {
  const { api } = useAuth();
  const { data } = useLiveData(() => api.catalog.providers(category.id), [category.id]);
  const providers = data?.providers ?? [];

  return (
    <>
      <NavigationHeader title={category.name} subtitle={category.description} onBack={onBack} />
      <div className="phone-scroll flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-600 p-4 text-white">
          <CategoryIcon slug={category.slug} size="lg" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Fastest option</p>
            <p className="text-xs text-white/80">Send your job to every available {category.name.toLowerCase()} provider. The first to accept gets it.</p>
            {baseFee !== undefined && <p className="mt-1 text-xs text-white/80">Visit fee from {formatLkr(baseFee)}</p>}
          </div>
        </div>
        <ActionButton fullWidth size="lg" onClick={onBookAny}>
          Book any available provider
        </ActionButton>

        <h3 className="pt-2 text-sm font-semibold text-slate-800">Or choose a provider ({providers.length})</h3>
        {data && providers.length === 0 && <p className="text-sm text-slate-500">No verified providers in this category yet. Book anyway and we'll notify new providers.</p>}
        <div className="space-y-2">
          {providers.map((p) => (
            <ProviderCard key={p.userId} provider={p} onOpen={() => onProvider(p.userId)} />
          ))}
        </div>
      </div>
    </>
  );
}

function ProviderDetailScreen({ providerId, onBack, onBook }: { providerId: number; onBack: () => void; onBook: () => void }) {
  const { api } = useAuth();
  const { data, error } = useLiveData(() => api.catalog.provider(providerId), [providerId]);
  if (error) return <NavigationHeader title={error} onBack={onBack} />;
  if (!data) return <FullScreenLoader />;
  const { provider, reviews } = data;

  return (
    <>
      <NavigationHeader title={provider.fullName} subtitle={provider.city} onBack={onBack} />
      <div className="phone-scroll flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center ring-1 ring-slate-100">
          <Avatar name={provider.fullName} color={provider.avatarColor} size="lg" />
          <p className="text-lg font-bold text-slate-900">{provider.fullName}</p>
          <p className="flex items-center gap-1 text-sm text-slate-600">
            <Star size={14} className="fill-amber-400 text-amber-400" /> {provider.averageRating.toFixed(1)} · {provider.totalReviews} reviews · {provider.completedJobs} jobs
          </p>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">✓ Verified provider</span>
          <p className="text-sm text-slate-600">{provider.bio}</p>
          <div className="grid w-full grid-cols-2 gap-2 pt-2 text-left">
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Experience</p>
              <p className="text-sm font-semibold">{provider.yearsOfExperience} years</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Hourly rate</p>
              <p className="text-sm font-semibold">{formatLkr(provider.hourlyRate)}</p>
            </div>
          </div>
        </div>

        <ActionButton fullWidth size="lg" onClick={onBook} disabled={!provider.isAvailable}>
          {provider.isAvailable ? `Request ${provider.fullName.split(' ')[0]}` : 'Currently offline'}
        </ActionButton>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Reviews</h3>
          {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{r.customerName}</p>
                  <p className="text-xs text-amber-500" aria-label={`${r.rating} out of 5 stars`}>
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-200">{'★'.repeat(5 - r.rating)}</span>
                  </p>
                </div>
                {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                {r.providerResponse && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Reply: {r.providerResponse}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// ---------- Booking form ----------

function BookingFormScreen({
  category,
  providerId,
  prefill,
  baseFee,
  onBack,
  onBooked,
}: {
  category: Category;
  providerId?: number;
  prefill?: BookingPrefill;
  baseFee: number;
  onBack: () => void;
  onBooked: (bookingId: number) => void;
}) {
  const { api } = useAuth();
  const addresses = useLiveData(() => api.users.addresses());
  const provider = useLiveData(providerId ? () => api.catalog.provider(providerId) : null, [providerId]);
  const [form, setForm] = useState({
    title: prefill?.title ?? '',
    description: prefill?.description ?? '',
    urgency: prefill?.urgency ?? ('NORMAL' as Urgency),
    preferredDate: '',
    addressId: 0,
  });
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', city: '' });
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [busy, setBusy] = useState(false);

  const list = addresses.data?.addresses ?? [];
  const selectedAddressId = form.addressId || list.find((a) => a.isDefault)?.id || list[0]?.id || 0;
  const estimate = form.urgency === 'URGENT' ? Math.round(baseFee * 1.25) : baseFee;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let addressId = selectedAddressId;
      if (!addressId) {
        const { address } = await api.users.addAddress(newAddress);
        addressId = address.id;
      }
      const { booking } = await api.bookings.create({
        categoryId: category.id,
        title: form.title,
        description: form.description,
        urgency: form.urgency,
        addressId,
        requestedProviderId: providerId,
        preferredDate: form.preferredDate ? new Date(form.preferredDate).toISOString() : undefined,
        aiSummary: prefill?.aiSummary,
      });
      onBooked(booking.id);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err : new ApiRequestError(0, (err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500';
  const fieldError = (name: string) => error?.fieldError(name) && <span className="mt-1 block text-xs text-red-600">{error.fieldError(name)}</span>;

  return (
    <>
      <NavigationHeader title={`Book ${category.name}`} subtitle={provider.data ? `Request to ${provider.data.provider.fullName}` : 'Open to all available providers'} onBack={onBack} />
      <form onSubmit={submit} className="phone-scroll flex-1 space-y-4 overflow-y-auto p-4">
        {prefill?.aiSummary && (
          <p className="flex gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
            <Sparkles size={14} className="mt-px shrink-0" /> {prefill.aiSummary}
          </p>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Job title</span>
          <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kitchen sink leaking" />
          {fieldError('title')}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Describe the problem</span>
          <textarea rows={4} className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened, since when, anything the provider should bring" />
          {fieldError('description')}
        </label>

        <fieldset>
          <legend className="mb-1 text-xs font-medium text-slate-600">How urgent is it?</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['LOW', 'NORMAL', 'URGENT'] as Urgency[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm({ ...form, urgency: u })}
                aria-pressed={form.urgency === u}
                className={`rounded-xl py-2 text-xs font-semibold ring-1 ${form.urgency === u ? (u === 'URGENT' ? 'bg-red-600 text-white ring-red-600' : 'bg-brand-600 text-white ring-brand-600') : 'bg-white text-slate-600 ring-slate-200'}`}
              >
                {u === 'LOW' ? 'Can wait' : u === 'NORMAL' ? 'Today/tomorrow' : 'Urgent'}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
            <CalendarDays size={12} /> Preferred time (optional)
          </span>
          <input type="datetime-local" className={input} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
        </label>

        <fieldset>
          <legend className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
            <MapPin size={12} /> Address
          </legend>
          {list.length > 0 ? (
            <div className="space-y-2">
              {list.map((a) => (
                <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 ring-1 ${selectedAddressId === a.id ? 'ring-2 ring-brand-500' : 'ring-slate-200'}`}>
                  <input type="radio" name="address" className="accent-brand-600" checked={selectedAddressId === a.id} onChange={() => setForm({ ...form, addressId: a.id })} />
                  <span className="text-sm">
                    <span className="block font-semibold text-slate-800">{a.label}</span>
                    <span className="block text-xs text-slate-500">
                      {a.line1}, {a.city}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            addresses.data && (
              <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <input className={input} placeholder="Street address" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                {fieldError('line1')}
                <input className={input} placeholder="City (e.g. Colombo)" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                {fieldError('city')}
              </div>
            )
          )}
          {fieldError('addressId')}
        </fieldset>

        <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3 text-sm">
          <span className="text-slate-600">Visit fee (pay after the job)</span>
          <span className="font-semibold text-slate-900">{formatLkr(estimate)}</span>
        </div>
        <p className="-mt-2 text-[11px] text-slate-500">The provider may send a quote for parts and labour. You approve it in the app before they continue.</p>

        {error && !error.details.length && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>}
        <ActionButton type="submit" fullWidth size="lg" loading={busy} icon={<ChevronRight size={18} />}>
          Confirm booking
        </ActionButton>
      </form>
    </>
  );
}
