// Customer and provider phones side by side, each with its own login. Both apps listen
// to the same /api/events stream, so a booking made on the left shows up on the right's
// radar immediately, and every status change syncs both ways.

import { ArrowLeftRight, Radio } from 'lucide-react';
import { AuthProvider } from '../../context/AuthContext';
import { useLiveVersion } from '../../services/api';
import MobileAppContainer from '../mobile/MobileAppContainer';
import CustomerApp from '../customer/CustomerApp';
import ProviderApp from '../provider/ProviderApp';

const STEPS = [
  'Customer: log in as Shanika or Nimal, describe a problem and book.',
  'Provider: log in as the matching trade (e.g. Sunil for electrical) and accept from the radar.',
  'Provider: start the journey. The customer sees them move on the map.',
  'Provider: send a quote, then the invoice. Customer approves and confirms.',
  'Customer: leave a review. Open Admin to see it all in the dashboard.',
];

export default function DualView() {
  const version = useLiveVersion();

  return (
    <div className="w-full max-w-7xl px-2 py-6 sm:px-4">
      <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-start xl:justify-center">
        <AuthProvider scope="customer">
          <MobileAppContainer variant="customer" label="Customer app">
            <CustomerApp />
          </MobileAppContainer>
        </AuthProvider>

        <aside className="order-first w-full max-w-sm space-y-3 xl:order-none xl:mt-10 xl:w-64">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <ArrowLeftRight size={18} />
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <Radio size={12} className="text-green-600" /> Live sync · v{version}
            </span>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            <p className="mb-2 font-semibold text-slate-800">Try the full flow</p>
            <ol className="list-decimal space-y-1.5 pl-4 text-slate-600">
              {STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-400">Demo password for every account: password123</p>
          </div>
        </aside>

        <AuthProvider scope="provider">
          <MobileAppContainer variant="provider" label="Provider app">
            <ProviderApp />
          </MobileAppContainer>
        </AuthProvider>
      </div>
    </div>
  );
}
