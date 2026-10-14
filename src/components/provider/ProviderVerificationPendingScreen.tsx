// Shown to providers who are not approved yet: the verification form (new or rejected
// accounts), the "under review" state, or the suspended notice.

import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Ban, Clock, FileCheck2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError, formatDateTime, useLiveData } from '../../services/api';
import ActionButton from '../common/ActionButton';

export default function ProviderVerificationPendingScreen() {
  const { providerProfile, logout, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const profile = providerProfile!;

  // Pick up the admin's decision as soon as it happens.
  useLiveData(() => refresh(), []);

  if (profile.status === 'NOT_SUBMITTED' || profile.status === 'REJECTED' || editing) {
    return <VerificationForm onDone={() => setEditing(false)} />;
  }

  const suspended = profile.status === 'SUSPENDED';
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 px-8 text-center">
      <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`grid h-20 w-20 place-items-center rounded-full ${suspended ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
        {suspended ? <Ban size={36} /> : <Clock size={36} />}
      </motion.span>
      <h1 className="text-xl font-bold text-slate-900">{suspended ? 'Account suspended' : 'Verification in progress'}</h1>
      <p className="text-sm text-slate-600">
        {suspended
          ? (profile.verificationNote ?? 'Your account is suspended. Contact HelpDesk support for details.')
          : 'Our team is checking your NIC and trade details. This usually takes less than a day. You will get a notification when you are approved.'}
      </p>
      {!suspended && profile.submittedAt && <p className="text-xs text-slate-400">Submitted {formatDateTime(profile.submittedAt)}</p>}
      <ol className="w-full space-y-2 text-left text-sm">
        {[
          ['Account created', true],
          ['Documents submitted', true],
          ['Admin review', false],
          ['Start receiving jobs', false],
        ].map(([label, done]) => (
          <li key={label as string} className="flex items-center gap-2 rounded-xl bg-white p-2.5 ring-1 ring-slate-100">
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${done ? 'bg-provider-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{done ? '✓' : ''}</span>
            <span className={done ? 'text-slate-800' : 'text-slate-400'}>{label}</span>
          </li>
        ))}
      </ol>
      {!suspended && (
        <ActionButton variant="secondary" onClick={() => setEditing(true)}>
          Edit my details
        </ActionButton>
      )}
      <ActionButton variant="ghost" onClick={logout} icon={<LogOut size={16} />}>
        Log out
      </ActionButton>
    </div>
  );
}

function VerificationForm({ onDone }: { onDone: () => void }) {
  const { api, providerProfile, refresh, logout } = useAuth();
  const catalog = useLiveData(() => api.catalog.categories());
  const profile = providerProfile!;
  const [form, setForm] = useState({
    nicNumber: profile.nicNumber ?? '',
    categoryIds: profile.categoryIds,
    yearsOfExperience: String(profile.yearsOfExperience || ''),
    bio: profile.bio,
    city: profile.city,
  });
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.provider.submitVerification({ ...form, yearsOfExperience: Number(form.yearsOfExperience || 0) });
      await refresh();
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err : new ApiRequestError(0, (err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-provider-500';
  const fieldError = (name: string) => error?.fieldError(name) && <span className="mt-1 block text-xs text-red-600">{error.fieldError(name)}</span>;

  return (
    <form onSubmit={submit} className="phone-scroll h-full space-y-4 overflow-y-auto bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-provider-100 text-provider-700">
          <ShieldCheck size={26} />
        </span>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Get verified</h1>
          <p className="text-xs text-slate-500">Customers only see verified providers.</p>
        </div>
      </div>

      {profile.status === 'REJECTED' && profile.verificationNote && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <span className="font-semibold">Not approved: </span>
          {profile.verificationNote} Please fix this and submit again.
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">NIC number</span>
        <input className={input} value={form.nicNumber} onChange={(e) => setForm({ ...form, nicNumber: e.target.value })} placeholder="199012345678 or 901234567V" />
        {fieldError('nicNumber')}
      </label>

      <fieldset>
        <legend className="mb-1 text-xs font-medium text-slate-600">Your trades</legend>
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
        {fieldError('categoryIds')}
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Years of experience</span>
          <input type="number" min={0} max={80} className={input} value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
          {fieldError('yearsOfExperience')}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Base city</span>
          <input className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          {fieldError('city')}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">About your work</span>
        <textarea rows={3} className={input} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="What you do, certifications, areas you cover" />
        {fieldError('bio')}
      </label>

      <p className="flex gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
        <FileCheck2 size={16} className="shrink-0" /> In the full app you would also upload photos of your NIC and trade certificates here.
      </p>

      {error && !error.details.length && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>}
      <ActionButton type="submit" variant="provider" size="lg" fullWidth loading={busy}>
        Submit for verification
      </ActionButton>
      <ActionButton variant="ghost" fullWidth onClick={logout} icon={<LogOut size={16} />}>
        Log out
      </ActionButton>
    </form>
  );
}
