import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ActionButton } from './ActionButton';
import { 
  Wrench, 
  Search, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  AlertCircle,
  X,
  FileText,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';
import { ServiceCategory } from '../../types';

interface Props {
  onSelectRolePerspective?: (role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN') => void;
  onOpenAdminPortal?: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onSelectRolePerspective, onOpenAdminPortal }) => {
  const { login, register, isLoading } = useAuth();

  // Mode selection & Form state
  const [selectedIntent, setSelectedIntent] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER' | 'ADMIN_SIGN_IN'>('SIGN_IN');
  const [showLegalModal, setShowLegalModal] = useState<'TERMS' | 'PRIVACY' | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serviceCategory, setServiceCategory] = useState('cat-plumbing');
  const [serviceArea, setServiceArea] = useState('Colombo 01-15 (Metro)');
  const [experienceYears, setExperienceYears] = useState(3);
  const [bio, setBio] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'ADMIN_SIGN_IN') {
        // Admin Login
        if (!email.trim() || !password) {
          throw new Error('Please enter administrator email and password.');
        }
        await login(email.trim(), password);
        if (onSelectRolePerspective) {
          onSelectRolePerspective('ADMIN');
        }
      } else if (authMode === 'SIGN_IN') {
        // Existing user login (Customer or Provider, supports email or phone)
        const loginIdentifier = email.trim() || phone.trim();
        if (!loginIdentifier || !password) {
          throw new Error('Please enter your email address or mobile number, and password.');
        }
        await login(loginIdentifier, password);
        if (onSelectRolePerspective) {
          onSelectRolePerspective(selectedIntent);
        }
      } else {
        // Registration
        if (!name.trim()) throw new Error('Full Name is required.');
        if (!email.trim()) throw new Error('Email address is required.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          throw new Error('Please enter a valid email address (e.g. user@example.com).');
        }
        if (!phone.trim()) throw new Error('Mobile number is required.');
        if (!password) throw new Error('Password is required.');
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter confirm password.');
        }

        const payload: any = {
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role: selectedIntent
        };

        if (selectedIntent === 'PROVIDER') {
          payload.serviceCategoryIds = [serviceCategory];
          payload.experienceYears = Number(experienceYears) || 1;
          payload.bio = bio.trim() || 'Professional service partner on HelpDesk.';
          payload.serviceAreas = [serviceArea];
        }

        await register(payload);
        setSuccessMessage(
          selectedIntent === 'PROVIDER'
            ? 'Provider registration submitted! Account is pending admin approval.'
            : 'Registration complete! Welcome to HelpDesk.'
        );

        setTimeout(() => {
          if (onSelectRolePerspective) {
            onSelectRolePerspective(selectedIntent);
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-start py-6 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Brand & Introduction */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            OFFICIAL HELPDESK PLATFORM • SRI LANKA
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
              HelpDesk
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            The intelligent on-demand platform connecting Sri Lankan households with verified plumbers, electricians, AC mechanics, carpenters, and technicians.
          </p>
        </div>

        {/* The Two Main Action Cards: Find a Professional & Offer Your Services */}
        {authMode !== 'ADMIN_SIGN_IN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Find a Professional */}
            <button
              type="button"
              onClick={() => {
                setSelectedIntent('CUSTOMER');
                setErrorMessage(null);
              }}
              className={`p-6 rounded-3xl text-left border transition-all relative overflow-hidden group active:scale-[0.99] ${
                selectedIntent === 'CUSTOMER'
                  ? 'bg-gradient-to-br from-blue-900/60 to-slate-800/90 border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-900/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedIntent === 'CUSTOMER' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-300'
                }`}>
                  <Search className="w-6 h-6" />
                </div>
                {selectedIntent === 'CUSTOMER' && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition">
                  Find a Professional
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Book certified plumbers, electricians, cleaners, and mechanics with upfront LKR pricing, GPS tracking, and AI fault diagnosis.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                <span>Book Home Services</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </button>

            {/* Card 2: Offer Your Services */}
            <button
              type="button"
              onClick={() => {
                setSelectedIntent('PROVIDER');
                setErrorMessage(null);
              }}
              className={`p-6 rounded-3xl text-left border transition-all relative overflow-hidden group active:scale-[0.99] ${
                selectedIntent === 'PROVIDER'
                  ? 'bg-gradient-to-br from-teal-900/60 to-slate-800/90 border-teal-500 ring-2 ring-teal-500/50 shadow-xl shadow-teal-900/30'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedIntent === 'PROVIDER' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-700 text-slate-300'
                }`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                {selectedIntent === 'PROVIDER' && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition">
                  Offer Your Services
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Join HelpDesk as an independent trade professional. Receive local repair leads in your district, control base callout rates, and grow earnings.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-400">
                <span>Earn on HelpDesk</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </button>

          </div>
        )}

        {/* Authentication Card (Sign In / Register / Admin Login) */}
        <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl backdrop-blur-md max-w-xl mx-auto w-full">
          
          {/* Form Header Tabs */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-700/80">
            <div>
              <h2 className="text-lg font-bold text-white">
                {authMode === 'ADMIN_SIGN_IN'
                  ? 'Administrator Access Portal'
                  : authMode === 'SIGN_IN'
                  ? `Sign In (${selectedIntent === 'CUSTOMER' ? 'Customer' : 'Provider Partner'})`
                  : `Create Account (${selectedIntent === 'CUSTOMER' ? 'Customer' : 'Provider Partner'})`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'ADMIN_SIGN_IN'
                  ? 'Restricted to authorized platform governance staff'
                  : authMode === 'SIGN_IN'
                  ? 'Enter your credentials to continue to your dashboard'
                  : 'Register a verified account to get started'}
              </p>
            </div>

            {authMode !== 'ADMIN_SIGN_IN' && (
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => { setAuthMode('SIGN_IN'); setErrorMessage(null); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    authMode === 'SIGN_IN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('REGISTER'); setErrorMessage(null); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    authMode === 'REGISTER' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Inline Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Inline Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Registration Fields */}
            {authMode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priyantha Dissanayake"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number (Sri Lanka +94) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Additional fields for Service Provider Registration */}
                {selectedIntent === 'PROVIDER' && (
                  <div className="p-3.5 bg-teal-950/40 border border-teal-800/60 rounded-2xl space-y-3">
                    <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                      <Briefcase className="w-4 h-4" />
                      <span>Trade & Professional Information</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Primary Trade Category</label>
                      <select
                        value={serviceCategory}
                        onChange={(e) => setServiceCategory(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="cat-plumbing">Plumbing & Pipe Fitting</option>
                        <option value="cat-electrical">Electrical & Wiring</option>
                        <option value="cat-ac">Air Conditioning Servicing</option>
                        <option value="cat-carpentry">Carpentry & Woodwork</option>
                        <option value="cat-masonry">Masonry & Tiling</option>
                        <option value="cat-painting">House Painting</option>
                        <option value="cat-appliance">Home Appliance Repair</option>
                        <option value="cat-cleaning">Deep Cleaning</option>
                        <option value="cat-gardening">Gardening & Lawn Care</option>
                        <option value="cat-other">Other Home Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Service Area / District</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <select
                          value={serviceArea}
                          onChange={(e) => setServiceArea(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="Colombo 01-15 (Metro)">Colombo 01-15 (Metro)</option>
                          <option value="Dehiwala / Mount Lavinia">Dehiwala / Mount Lavinia</option>
                          <option value="Rajagiriya / Battaramulla">Rajagiriya / Battaramulla</option>
                          <option value="Gampaha District">Gampaha District</option>
                          <option value="Kandy & Central Province">Kandy & Central Province</option>
                          <option value="Galle & Southern Coastal">Galle & Southern Coastal</option>
                          <option value="Kalutara District">Kalutara District</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(Number(e.target.value))}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Base Callout (LKR)</label>
                        <input
                          type="text"
                          disabled
                          value="Rs. 1,500 (Default)"
                          className="w-full p-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Short Professional Bio</label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Certified wireman with 5 years experience in CEB installations and domestic repairs."
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email / Identifier Field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {authMode === 'SIGN_IN' ? 'Email Address or Mobile Number *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={authMode === 'SIGN_IN' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    authMode === 'ADMIN_SIGN_IN' 
                      ? 'admin@helpdesk.lk' 
                      : authMode === 'SIGN_IN'
                      ? 'dinuka@gmail.com or +94 77 234 5678'
                      : selectedIntent === 'PROVIDER' 
                      ? 'kasun.plumber@helpdesk.lk' 
                      : 'dinuka@gmail.com'
                  }
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-bold">Password *</label>
                {authMode === 'SIGN_IN' && (
                  <span className="text-[10px] text-slate-400">Demo password: password123</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register Only) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2">
              <ActionButton
                type="submit"
                isLoading={isSubmitting || isLoading}
                loadingLabel={authMode === 'SIGN_IN' ? 'Authenticating...' : 'Registering account...'}
                label={
                  authMode === 'ADMIN_SIGN_IN'
                    ? 'Authenticate as Admin'
                    : authMode === 'SIGN_IN'
                    ? `Sign In to ${selectedIntent === 'CUSTOMER' ? 'Customer App' : 'Provider Panel'}`
                    : `Complete ${selectedIntent === 'CUSTOMER' ? 'Customer' : 'Provider'} Registration`
                }
                variant={selectedIntent === 'PROVIDER' ? 'success' : 'primary'}
                size="md"
              />
            </div>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Quick Test Accounts (Pre-seeded):</span>
              <span className="text-[10px] text-blue-400">Tap to auto-fill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedIntent('CUSTOMER');
                  setAuthMode('SIGN_IN');
                  setEmail('dinuka@gmail.com');
                  setPassword('password123');
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-left border border-slate-700/80 transition"
              >
                <span className="font-bold text-white block truncate">Dinuka (Customer)</span>
                <span className="text-[10px] text-slate-400 block truncate">Active plumbing leak</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIntent('PROVIDER');
                  setAuthMode('SIGN_IN');
                  setEmail('kasun.plumber@helpdesk.lk');
                  setPassword('password123');
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-left border border-slate-700/80 transition"
              >
                <span className="font-bold text-white block truncate">Kasun (Approved Pro)</span>
                <span className="text-[10px] text-slate-400 block truncate">⭐ 4.9 Plumber</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedIntent('PROVIDER');
                  setAuthMode('SIGN_IN');
                  setEmail('dilshan.carpenter@helpdesk.lk');
                  setPassword('password123');
                }}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-left border border-slate-700/80 transition"
              >
                <span className="font-bold text-white block truncate">Dilshan (Pending Pro)</span>
                <span className="text-[10px] text-amber-400 block truncate">⏳ Verification Pending</span>
              </button>
            </div>
          </div>

          {/* Admin Switcher & Public Footnotes */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            {authMode === 'ADMIN_SIGN_IN' ? (
              <button
                type="button"
                onClick={() => { setAuthMode('SIGN_IN'); setErrorMessage(null); }}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                ← Back to Mobile Portal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('ADMIN_SIGN_IN');
                  setEmail('admin@helpdesk.lk');
                  setPassword('password123');
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-purple-300 flex items-center gap-1 transition"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login Portal</span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLegalModal('TERMS')}
                className="hover:text-slate-200 underline decoration-slate-600 underline-offset-2"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setShowLegalModal('PRIVACY')}
                className="hover:text-slate-200 underline decoration-slate-600 underline-offset-2"
              >
                Privacy Policy
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Terms & Privacy Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                {showLegalModal === 'TERMS' ? 'HelpDesk Platform Terms of Service' : 'HelpDesk Privacy Policy'}
              </h3>
              <button
                onClick={() => setShowLegalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1">
              {showLegalModal === 'TERMS' ? (
                <>
                  <p><strong>1. Introduction:</strong> Welcome to HelpDesk (Sri Lanka). By booking services or registering as a trade provider, you agree to comply with our platform regulations.</p>
                  <p><strong>2. Customer Rights:</strong> Transparent callout and hourly rates in Sri Lankan Rupees (LKR). Any unforeseen materials must be proposed and explicitly approved before being charged.</p>
                  <p><strong>3. Provider Obligations:</strong> Service professionals must hold valid National Identity Cards (NIC) and appropriate trade certifications. Unapproved providers cannot accept customer bookings.</p>
                  <p><strong>4. Safety & Disputes:</strong> All in-person bookings are governed by platform dispute mediation. Admin reserves the right to suspend accounts violating safety guidelines.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Data Collection:</strong> We collect contact information, location coordinates for dispatch accuracy, and verification documents to safeguard users.</p>
                  <p><strong>2. Privacy Guarantee:</strong> Phone numbers and exact addresses are revealed to assigned technicians only upon confirmed booking acceptance.</p>
                  <p><strong>3. Document Security:</strong> Provider NICs, police reports, and technical diplomas are securely stored and inspected solely by authorized administrators.</p>
                </>
              )}
            </div>
            <div className="pt-2">
              <button
                onClick={() => setShowLegalModal(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                I Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};