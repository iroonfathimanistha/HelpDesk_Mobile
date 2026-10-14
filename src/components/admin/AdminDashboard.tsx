import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminPricingRules } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Search, 
  Filter, 
  Check, 
  X, 
  ExternalLink, 
  RotateCcw, 
  FileText, 
  BarChart3, 
  Eye, 
  Lock, 
  Unlock,
  Building,
  Calendar,
  Sparkles,
  Sliders,
  Star,
  Settings,
  HelpCircle,
  Menu,
  Smartphone,
  LogOut,
  Shield
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcons';

interface AdminDashboardProps {
  onOpenMobileApp?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenMobileApp }) => {
  const { user, switchDemoAccount, refreshMe, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'verifications' | 'pricing' | 'bookings' | 'users' | 'complaints' | 'reviews'>('overview');
  
  const [stats, setStats] = useState<any | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<AdminPricingRules | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification modal state
  const [selectedProviderToVerify, setSelectedProviderToVerify] = useState<any | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Booking inspect modal state
  const [inspectedBooking, setInspectedBooking] = useState<any | null>(null);

  // Complaint resolve modal
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Pricing rules edit form states
  const [minCallout, setMinCallout] = useState(1000);
  const [maxCallout, setMaxCallout] = useState(10000);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [emergencyMult, setEmergencyMult] = useState(1.5);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Filters
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');

  const loadAdminData = async () => {
    if (user?.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const [dash, pending, bks, usrs, cmps, rules] = await Promise.all([
        api.getAdminDashboard(),
        api.getPendingProviders(),
        api.getServiceRequests(),
        api.getAdminUsers(),
        api.getComplaints(),
        api.getAdminPricingRules().catch(() => null)
      ]);

      setStats(dash.stats);
      setStatusCounts(dash.statusCounts);
      setCategoryCounts(dash.categoryCounts);
      setPendingProviders(pending);
      setAllBookings(bks);
      setAllUsers(usrs);
      setComplaints(cmps);
      if (rules) {
        setPricingRules(rules);
        setMinCallout(rules.minCalloutFeeLkr);
        setMaxCallout(rules.maxCalloutFeeLkr);
        setCommissionPercent(rules.platformCommissionPercent);
        setEmergencyMult(rules.defaultEmergencyMultiplier);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  // Handle Provider Verification Decision
  const handleVerifyProvider = async (providerId: string, decision: 'APPROVED' | 'REJECTED') => {
    setIsVerifying(true);
    try {
      await api.verifyProvider(providerId, decision, verificationNotes || (decision === 'APPROVED' ? 'Approved by Admin after credential review.' : 'Application rejected.'));
      alert(`Provider status updated to ${decision}!`);
      setSelectedProviderToVerify(null);
      setVerificationNotes('');
      await loadAdminData();
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Save Pricing Rules
  const handleSavePricingRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRules(true);
    try {
      const updated = await api.updateAdminPricingRules({
        minCalloutFeeLkr: Number(minCallout),
        maxCalloutFeeLkr: Number(maxCallout),
        platformCommissionPercent: Number(commissionPercent),
        defaultEmergencyMultiplier: Number(emergencyMult)
      });
      setPricingRules(updated);
      alert('Pricing rules and limits saved to database!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingRules(false);
    }
  };

  // Handle User Suspension / Reactivation
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = prompt(`Enter reason for ${nextStatus === 'SUSPENDED' ? 'suspending' : 'reactivating'} this user:`, 'Administrative compliance review');
    if (!reason) return;

    try {
      await api.updateUserStatus(userId, nextStatus, reason);
      await loadAdminData();
      alert(`User account marked ${nextStatus}.`);
    } catch (err: any) {
      alert('Status update error: ' + err.message);
    }
  };

  // Handle Complaint Resolution
  const handleResolveComplaint = async () => {
    if (!selectedComplaint || !resolutionNotes) return;
    setIsResolving(true);
    try {
      await api.resolveComplaint(selectedComplaint.id, resolutionNotes, 'RESOLVED');
      alert('Complaint resolved successfully!');
      setSelectedComplaint(null);
      setResolutionNotes('');
      await loadAdminData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsResolving(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Authorization Required</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              The Admin Management Dashboard is restricted to authorized platform administrators. You are currently logged in as <strong>{user?.name || 'Guest'} ({user?.role || 'User'})</strong>.
            </p>
          </div>
          <button
            onClick={() => switchDemoAccount('admin-dilrukshi')}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Switch to Admin (Dilrukshi Alwis)
          </button>

          {onOpenMobileApp && (
            <button
              onClick={onOpenMobileApp}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Return to User Mobile App
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Professional Web Admin Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-6 py-3 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-md text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">HelpDesk Admin</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                HQ WEB CONSOLE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Sri Lanka Operations Governance & Dispatch Audit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenMobileApp && (
            <button
              onClick={onOpenMobileApp}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
              title="Launch Customer & Provider Mobile App"
            >
              <Smartphone className="w-4 h-4" />
              <span>Launch Mobile App</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-800" />

          {/* Admin User Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white leading-tight">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-purple-400 font-medium">Operations Lead</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Title Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-900/40 px-2.5 py-0.5 rounded-full border border-blue-700/50">
              DESKTOP MANAGEMENT CONSOLE
            </span>
            <span className="text-xs text-slate-400">• Sri Lanka Operations</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            HelpDesk Administration & Governance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Oversee provider credential verifications, dispute resolutions, pricing policies, and dispatch metrics.
          </p>
        </div>

        {/* Grouped Sidebar / Top Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'verifications', label: `Verification Queue (${pendingProviders.length})`, icon: ShieldCheck, alert: pendingProviders.length > 0 },
            { id: 'pricing', label: 'Pricing Rules', icon: Sliders },
            { id: 'bookings', label: 'Bookings Audit', icon: Calendar },
            { id: 'complaints', label: `Disputes (${complaints.filter(c => c.status === 'OPEN').length})`, icon: AlertTriangle },
            { id: 'users', label: 'User Directory', icon: Users }
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
                {sec.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== SECTION: OVERVIEW ==================== */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{stats.totalCustomers}</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[11px] text-slate-500">Verified residential accounts</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Service Providers</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{stats.totalProviders}</span>
                <Briefcase className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-[11px] text-amber-600 font-semibold">
                {stats.pendingVerificationsCount} pending verification
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Dispatches</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-blue-600">{stats.activeBookingsCount}</span>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[11px] text-slate-500">{stats.totalBookings} lifetime requests</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gross Volume (LKR)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-emerald-600">Rs. {stats.totalGrossLkr?.toLocaleString()}</span>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Rs. {stats.totalCommissionLkr?.toLocaleString()} net platform fee (10%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Booking Status Distribution</span>
                <span className="text-xs font-semibold text-slate-400">Total: {stats.totalBookings}</span>
              </h3>
              <div className="space-y-2.5">
                {Object.entries(statusCounts).map(([st, cnt]) => {
                  const percent = Math.round((cnt / (stats.totalBookings || 1)) * 100);
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{st.replace(/_/g, ' ')}</span>
                        <span>{cnt} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${
                            st === 'COMPLETED' ? 'bg-emerald-500' :
                            st === 'CANCELLED' ? 'bg-slate-400' :
                            st === 'PENDING' ? 'bg-amber-500' :
                            'bg-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>Service Requests by Trade</span>
                <span className="text-xs font-semibold text-slate-400">Top Categories</span>
              </h3>
              <div className="space-y-2.5">
                {Object.entries(categoryCounts).map(([cat, cnt]) => {
                  const percent = Math.round((cnt / (stats.totalBookings || 1)) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{cat}</span>
                        <span>{cnt} requests</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION: PRICING RULES CONFIGURATION ==================== */}
      {activeSection === 'pricing' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Platform Pricing Governance</h2>
            <p className="text-xs text-slate-500">
              Configure minimum and maximum callout limits, platform commission percentage, and emergency multipliers.
            </p>
          </div>

          <form onSubmit={handleSavePricingRules} className="max-w-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Minimum Permitted Callout (LKR)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={minCallout}
                  onChange={(e) => setMinCallout(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Maximum Permitted Callout (LKR)
                </label>
                <input
                  type="number"
                  min="2000"
                  step="500"
                  value={maxCallout}
                  onChange={(e) => setMaxCallout(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Platform Commission Fee (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="25"
                  step="1"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Emergency Multiplier (Default)
                </label>
                <input
                  type="number"
                  min="1.1"
                  max="3.0"
                  step="0.1"
                  value={emergencyMult}
                  onChange={(e) => setEmergencyMult(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingRules}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              {isSavingRules ? 'Saving Rules...' : 'Save Pricing Policies'}
            </button>
          </form>
        </div>
      )}

      {/* ==================== SECTION: PROVIDER VERIFICATION QUEUE ==================== */}
      {activeSection === 'verifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Provider Verification Queue</h2>
              <p className="text-xs text-slate-500">
                New service partners must be approved by administration before receiving jobs.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              {pendingProviders.length} Pending Approval
            </span>
          </div>

          {pendingProviders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-slate-700 text-sm">All Technician Applications Reviewed!</p>
              <p className="text-xs text-slate-500 mt-1">There are no pending applications in the queue.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingProviders.map((prov) => (
                <div key={prov.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={prov.userAvatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{prov.userName}</h4>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          PENDING REVIEW
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium block">
                        {prov.businessName} • {prov.experienceYears} Years Experience
                      </span>
                      <p className="text-xs text-slate-500 max-w-xl">
                        "{prov.bio}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedProviderToVerify(prov)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Docs
                    </button>
                    <button
                      onClick={() => handleVerifyProvider(prov.id, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyProvider(prov.id, 'REJECTED')}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SECTION: ALL BOOKINGS AUDIT ==================== */}
      {activeSection === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Bookings Audit</h2>
              <p className="text-xs text-slate-500">Complete audit log of all requested, in-progress, and completed jobs</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="ON_THE_WAY">ON_THE_WAY</option>
                <option value="ARRIVED">ARRIVED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="AWAITING_CUSTOMER_CONFIRMATION">AWAITING_CONFIRMATION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Amount (LKR)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allBookings
                  .filter(b => !bookingFilterStatus || b.status === bookingFilterStatus)
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{b.bookingReference}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{b.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">{b.providerName || 'Unassigned'}</td>
                      <td className="py-3 px-4">{b.categoryName}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Rs. {b.totalAmountLkr?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            const details = await api.getServiceRequest(b.id);
                            setInspectedBooking(details);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SECTION: DISPUTES & COMPLAINTS ==================== */}
      {activeSection === 'complaints' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dispute & Complaint Resolution</h2>
              <p className="text-xs text-slate-500">Customer and provider reported issues requiring administrative mediation</p>
            </div>
          </div>

          {complaints.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold text-slate-700 text-sm">No open complaints!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{c.subject}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Booking: #{c.bookingReference}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    "{c.description}"
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                    <span>Filed by: <strong>{c.filerName}</strong> ({c.filedByRole})</span>
                    {c.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs"
                      >
                        Resolve Dispute
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        Resolved: "{c.resolutionNotes}"
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SECTION: USERS ==================== */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">User Account Directory</h2>
              <p className="text-xs text-slate-500">Manage account access and suspension policies</p>
            </div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-60"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers
                  .filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'PROVIDER' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provider Doc Inspection Modal */}
      {selectedProviderToVerify && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Review Credentials: {selectedProviderToVerify.userName}
              </h3>
              <button onClick={() => setSelectedProviderToVerify(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p><strong>Business Name:</strong> {selectedProviderToVerify.businessName}</p>
              <p><strong>Experience:</strong> {selectedProviderToVerify.experienceYears} Years</p>
              <p><strong>Service Areas:</strong> {selectedProviderToVerify.serviceAreas?.join(', ')}</p>
              <p><strong>Bio:</strong> {selectedProviderToVerify.bio}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-600 block">National ID Document</span>
                <img
                  src={selectedProviderToVerify.nationalIdUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'}
                  alt="ID"
                  className="w-full h-24 object-cover rounded-lg border border-slate-200"
                />
              </div>
              <div className="p-2 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-600 block">Certificate & Police Check</span>
                <img
                  src={selectedProviderToVerify.certificateUrl || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600'}
                  alt="Cert"
                  className="w-full h-24 object-cover rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Audit Notes:
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Identity documents checked..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleVerifyProvider(selectedProviderToVerify.id, 'REJECTED')}
                disabled={isVerifying}
                className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleVerifyProvider(selectedProviderToVerify.id, 'APPROVED')}
                disabled={isVerifying}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Approve & Activate Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Inspection Modal */}
      {inspectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs text-blue-600 font-bold">{inspectedBooking.bookingReference}</span>
                <h3 className="font-bold text-slate-900 text-base">{inspectedBooking.title}</h3>
              </div>
              <button onClick={() => setInspectedBooking(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-slate-900">{inspectedBooking.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{inspectedBooking.customer?.name} ({inspectedBooking.customer?.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provider:</span>
                <span className="font-bold text-slate-900">{inspectedBooking.provider?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-blue-600">Rs. {inspectedBooking.totalAmountLkr?.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Status History Audit Trail
              </h4>
              <div className="space-y-1.5">
                {inspectedBooking.history?.map((h: any) => (
                  <div key={h.id} className="p-2 bg-slate-50 rounded-xl text-xs border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{h.fromStatus} → {h.toStatus}</span>
                      <p className="text-[11px] text-slate-500">"{h.note}"</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setInspectedBooking(null)}
              className="w-full py-2 bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Complaint Resolve Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Resolve Dispute #{selectedComplaint.id}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Grievance: </strong> "{selectedComplaint.description}"
            </p>

            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter mediation notes..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveComplaint}
                disabled={isResolving || !resolutionNotes}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
};