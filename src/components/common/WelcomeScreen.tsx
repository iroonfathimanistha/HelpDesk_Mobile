// Onboarding + login/register screen shared by the customer and provider apps.

import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiRequestError } from '../../services/api';
import ActionButton from './ActionButton';

const DEMO_ACCOUNTS = {
  customer: [
    { name: 'Nimal Perera', email: 'nimal@example.com', note: 'Has an active AC booking' },
    { name: 'Shanika Jayawardena', email: 'shanika@example.com', note: 'Waiting for an electrician' },
  ],
  provider: [
    { name: 'Ruwan Wijesinghe', email: 'ruwan@example.com', note: 'AC technician, has a job' },
    { name: 'Sunil Bandara', email: 'sunil@example.com', note: 'Electrician, open job nearby' },
    { name: 'Kamal Silva', email: 'kamal@example.com', note: 'Plumber' },
    { name: 'Dinesh Kumara', email: 'dinesh@example.com', note: 'Awaiting verification' },
  ],
} as const;

const DEMO_PASSWORD = 'password123';

export default function WelcomeScreen({ app }: { app: 'customer' | 'provider' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [busy, setBusy] = useState(false);
  const isProvider = app === 'provider';
  const variant = isProvider ? 'provider' : 'primary';
  const ring = isProvider ? 'focus:ring-provider-500' : 'focus:ring-brand-500';

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err : new ApiRequestError(0, (err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'login') return run(() => login(form.email, form.password));
    return run(() => register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined }));
  };

  const field = (name: keyof typeof form, label: string, type = 'text', autoComplete?: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={form[name]}
        autoComplete={autoComplete}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${ring}`}
      />
      {error?.fieldError(name) && <span className="mt-1 block text-xs text-red-600">{error.fieldError(name)}</span>}
    </label>
  );

  if (mode === 'welcome') {
    return (
      <div className={`flex h-full flex-col justify-between px-6 pt-10 pb-8 text-white ${isProvider ? 'bg-gradient-to-b from-provider-600 to-provider-900' : 'bg-gradient-to-b from-brand-600 to-brand-900'}`}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            {isProvider ? <Wrench size={32} /> : <Sparkles size={32} />}
          </div>
          <h1 className="text-3xl leading-tight font-extrabold">
            {isProvider ? 'Grow your business with HelpDesk Pro' : 'Home repairs, sorted.'}
          </h1>
          <p className="mt-3 text-base text-white/80">
            {isProvider
              ? 'Get nearby jobs, send quotes and get paid. Verified providers only.'
              : 'Book verified plumbers, electricians and AC technicians near you. Track them live.'}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/90">
            {(isProvider
              ? ['Jobs in your trades, near you', 'Quotes the customer approves in-app', 'Weekly earnings summary']
              : ['Describe the problem, AI finds the right trade', 'Live tracking and in-app chat', 'Upfront prices in LKR']
            ).map((item) => (
              <li key={item} className="flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <div className="space-y-3">
          <button type="button" onClick={() => setMode('register')} className={`w-full rounded-xl bg-white py-3.5 font-semibold ${isProvider ? 'text-provider-700' : 'text-brand-700'}`}>
            {isProvider ? 'Join as a provider' : 'Create an account'}
          </button>
          <button type="button" onClick={() => setMode('login')} className="w-full rounded-xl py-3 font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-scroll h-full overflow-y-auto bg-slate-50 px-5 pt-6 pb-8">
      <button type="button" onClick={() => { setMode('welcome'); setError(null); }} className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : isProvider ? 'Create your provider account' : 'Create your account'}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === 'login' ? 'Log in to continue.' : isProvider ? 'You will verify your NIC and trades next.' : 'It takes less than a minute.'}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === 'register' && field('fullName', 'Full name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {mode === 'register' && field('phone', 'Mobile number (optional)', 'tel', 'tel')}
        {field('password', 'Password', 'password', mode === 'login' ? 'current-password' : 'new-password')}
        {error && !error.details.length && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>}
        <ActionButton type="submit" variant={variant} size="lg" fullWidth loading={busy}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </ActionButton>
      </form>

      <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="mt-4 w-full text-center text-sm text-slate-500">
        {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
        <span className={`font-semibold ${isProvider ? 'text-provider-700' : 'text-brand-700'}`}>{mode === 'login' ? 'Sign up' : 'Log in'}</span>
      </button>

      {mode === 'login' && (
        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Demo accounts (password: {DEMO_PASSWORD})</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS[app].map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                onClick={() => run(() => login(account.email, DEMO_PASSWORD))}
                className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left ring-1 ring-slate-200 hover:ring-slate-300"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{account.name}</span>
                  <span className="block text-xs text-slate-500">{account.note}</span>
                </span>
                <span className={`text-xs font-semibold ${isProvider ? 'text-provider-700' : 'text-brand-700'}`}>Use</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
