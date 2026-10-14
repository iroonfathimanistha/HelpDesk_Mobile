import React, { useState, useEffect } from 'react';
import { 
  ServiceRequest, 
  BookingStatus, 
  RequestUrgency, 
  AdditionalChargeProposal,
  Review
} from '../../types';
import { api } from '../../services/api';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  X, 
  Info, 
  HelpCircle, 
  Calendar, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Camera,
  Check,
  AlertCircle
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface Props {
  bookingId: string;
  onBack: () => void;
  onOpenChat: (bookingId: string) => void;
  onBookingUpdated?: (booking: any) => void;
  onBookAnother?: () => void;
  onReturnHome?: () => void;
  hideTopHeader?: boolean;
}

export const LiveServiceTracker: React.FC<Props> = ({
  bookingId,
  onBack,
  onOpenChat,
  onBookingUpdated,
  onBookAnother,
  onReturnHome,
  hideTopHeader
}) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & confirmation dialogs
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [isCancelling, setIsCancelling] = useState(false);

  const [showConfirmCompletionModal, setShowConfirmCompletionModal] = useState(false);
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>(['Professional', 'On time', 'Quality work']);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState('Work quality issue');
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Collapsible sections
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [priceDetailsExpanded, setPriceDetailsExpanded] = useState(true);

  // Searching retry state
  const [searchingSeconds, setSearchingSeconds] = useState(0);

  // Load booking details
  const fetchBooking = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await api.getServiceRequest(bookingId);
      setBooking(data);
      if (onBookingUpdated) onBookingUpdated(data);
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Real-time polling every 3 seconds for live status transitions
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBooking(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [bookingId]);

  // Searching timer
  useEffect(() => {
    let timer: any;
    if (booking?.status === 'PENDING') {
      timer = setInterval(() => {
        setSearchingSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [booking?.status]);

  // Handle proposal respond
  const handleRespondToProposal = async (proposalId: string, approved: boolean) => {
    try {
      await api.respondToAdditionalCost(bookingId, { proposalId, approved });
      await fetchBooking();
    } catch (err: any) {
      alert('Error updating proposal: ' + err.message);
    }
  };

  // Handle confirm completion
  const handleConfirmCompletion = async () => {
    setIsConfirmingCompletion(true);
    try {
      const res = await api.confirmCompletion(bookingId);
      setBooking(res.booking);
      setShowConfirmCompletionModal(false);
      // Immediately open rating & review modal if not reviewed yet
      setShowReviewModal(true);
    } catch (err: any) {
      alert('Could not confirm completion: ' + err.message);
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  // Handle Cancel
  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      await api.cancelServiceRequest(bookingId, cancelReason);
      await fetchBooking();
      setShowCancelModal(false);
    } catch (err: any) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Submit Review
  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      alert('Please add a comment about your experience');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.submitReview(bookingId, ratingScore, reviewComment, reviewTags);
      setReviewSubmittedSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        fetchBooking();
      }, 1500);
    } catch (err: any) {
      alert('Review submission failed: ' + err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Submit Complaint
  const handleSubmitComplaint = async () => {
    if (!complaintText.trim()) {
      alert('Please explain the issue encountered');
      return;
    }
    setIsSubmittingComplaint(true);
    try {
      await api.submitComplaint(bookingId, complaintCategory, complaintText);
      alert('Your report has been submitted to HelpDesk Administration. Our Colombo customer support will mediate immediately.');
      setShowComplaintModal(false);
      setComplaintText('');
      await fetchBooking();
    } catch (err: any) {
      alert('Complaint filing failed: ' + err.message);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Review Tag Toggle Helper
  const toggleReviewTag = (tag: string) => {
    setReviewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading && !booking) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Loading service tracker...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h4 className="text-sm font-bold text-slate-800">Booking Details Unavailable</h4>
        <p className="text-xs text-slate-500 max-w-xs">{error || 'Could not find booking record'}</p>
        <button
          onClick={() => fetchBooking()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
        >
          Retry
        </button>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isAccepted = booking.status === 'ACCEPTED';
  const isOnTheWay = booking.status === 'ON_THE_WAY';
  const isArrived = booking.status === 'ARRIVED';
  const isInProgress = booking.status === 'IN_PROGRESS';
  const isAwaitingConfirmation = booking.status === 'AWAITING_CUSTOMER_CONFIRMATION';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';

  // Map 9 stages to boolean status
  // 1. Request submitted (always true)
  // 2. Finding provider (PENDING)
  // 3. Provider accepted (ACCEPTED+)
  // 4. Provider on the way (ON_THE_WAY+)
  // 5. Provider arrived (ARRIVED+)
  // 6. Work started (IN_PROGRESS+)
  // 7. Work completed by provider (AWAITING_CUSTOMER_CONFIRMATION+)
  // 8. Awaiting your confirmation (AWAITING_CUSTOMER_CONFIRMATION)
  // 9. Completed (COMPLETED)

  const stageStatuses = [
    {
      id: 1,
      title: 'Request submitted',
      subtitle: 'Your service request has been sent to dispatch',
      done: true,
      current: false
    },
    {
      id: 2,
      title: 'Finding provider',
      subtitle: isPending 
        ? 'HelpDesk is actively contacting verified nearby professionals' 
        : 'Matching completed',
      done: !isPending,
      current: isPending
    },
    {
      id: 3,
      title: 'Provider accepted',
      subtitle: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? `${booking.provider?.name || 'A professional'} accepted your booking`
        : 'Awaiting provider acceptance',
      done: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isAccepted
    },
    {
      id: 4,
      title: 'Provider on the way',
      subtitle: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician has departed and is travelling to your location'
        : 'Provider preparing tools and route',
      done: ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isOnTheWay
    },
    {
      id: 5,
      title: 'Provider arrived',
      subtitle: ['ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician has reached your premises'
        : 'Awaiting technician arrival',
      done: ['ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isArrived
    },
    {
      id: 6,
      title: 'Work started',
      subtitle: ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Inspection and repair work actively in progress'
        : 'Awaiting work start',
      done: ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isInProgress
    },
    {
      id: 7,
      title: 'Work completed by provider',
      subtitle: ['AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status)
        ? 'Technician completed repairs and submitted labor & parts bill'
        : 'Awaiting repair completion',
      done: ['AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED'].includes(booking.status),
      current: isAwaitingConfirmation
    },
    {
      id: 8,
      title: 'Awaiting your confirmation',
      subtitle: isCompleted 
        ? 'Confirmed by customer' 
        : (isAwaitingConfirmation ? 'Please inspect completed repairs and confirm invoice' : 'Pending completion review'),
      done: isCompleted,
      current: isAwaitingConfirmation
    },
    {
      id: 9,
      title: 'Completed',
      subtitle: isCompleted 
        ? 'Service successfully verified and finished' 
        : 'Final completion sign-off',
      done: isCompleted,
      current: isCompleted
    }
  ];

  // Estimated Arrival calculation
  const getEtaText = () => {
    if (isPending) return 'Calculating after acceptance';
    if (isAccepted) return 'Preparing equipment • ETA ~15-25 mins';
    if (isOnTheWay) return 'En route • ETA ~10-15 mins';
    if (isArrived) return 'Arrived on premises';
    if (isInProgress) return 'Work underway';
    if (isAwaitingConfirmation) return 'Work finished';
    if (isCompleted) return 'Service finished';
    return 'Arrival time unavailable';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* ==================== 1. COMPACT HEADER ==================== */}
      {!hideTopHeader && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs shrink-0 z-20">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Jobs</span>
          </button>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service Booking</span>
            <span className="text-xs font-extrabold text-slate-900">{booking.bookingReference}</span>
          </div>

          <button
            onClick={() => fetchBooking()}
            disabled={refreshing}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
            title="Refresh booking"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      )}

      {/* Main Scrollable Viewport */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-3.5 sm:p-4">

        {/* ==================== 2. STATUS BANNER ==================== */}
        <div className={`p-4 rounded-3xl shadow-sm text-white transition-all ${
          isCompleted ? 'bg-gradient-to-r from-emerald-600 to-teal-700' :
          isCancelled ? 'bg-gradient-to-r from-slate-600 to-slate-800' :
          isAwaitingConfirmation ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700' :
          isInProgress ? 'bg-gradient-to-r from-blue-700 to-indigo-800' :
          isArrived ? 'bg-gradient-to-r from-teal-600 to-cyan-700' :
          isOnTheWay ? 'bg-gradient-to-r from-sky-600 to-blue-700' :
          isAccepted ? 'bg-gradient-to-r from-blue-600 to-indigo-700' :
          'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'
        }`}>
          <div className="flex items-center justify-between text-xs text-white/80 pb-1">
            <span className="font-bold flex items-center gap-1.5">
              {isPending && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />}
              {booking.category?.name || 'Home Service'}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              booking.urgency === 'EMERGENCY' ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'
            }`}>
              {booking.urgency}
            </span>
          </div>

          <h2 className="text-base font-extrabold tracking-tight text-white mt-0.5">
            {isPending && 'Finding Nearby Professionals...'}
            {isAccepted && 'Service Provider Accepted!'}
            {isOnTheWay && 'Provider is On The Way'}
            {isArrived && 'Provider Has Arrived'}
            {isInProgress && 'Work Actively In Progress'}
            {isAwaitingConfirmation && 'Work Finished — Review Details'}
            {isCompleted && 'Service Completed & Signed Off'}
            {isCancelled && 'Service Request Cancelled'}
          </h2>

          <p className="text-xs text-white/90 mt-1 leading-relaxed">
            {isPending && 'HelpDesk is actively contacting approved professionals in your zone in Colombo.'}
            {isAccepted && 'Your technician has accepted the job and is preparing tools and dispatch details.'}
            {isOnTheWay && 'Technician is en route to your service address. Track live status below.'}
            {isArrived && 'Technician is at your location. Please provide property entry access.'}
            {isInProgress && 'Repairs are actively underway. You can chat or call the technician anytime.'}
            {isAwaitingConfirmation && 'The technician submitted completion notes and the final cost breakdown. Please inspect and confirm.'}
            {isCompleted && 'Thank you for using HelpDesk Sri Lanka! Your invoice and warranty are stored.'}
            {isCancelled && `Booking was cancelled. Reason: ${booking.cancellationReason || 'User request'}.`}
          </p>

          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] font-bold text-white/90">
            <span>Status: {booking.status.replace(/_/g, ' ')}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {getEtaText()}
            </span>
          </div>
        </div>

        {/* ==================== 3. PICKME-INSPIRED SEARCHING STATE / MAP AREA ==================== */}
        {isPending ? (
          /* PickMe-Inspired Animated Radar Searching Card */
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs text-center space-y-4 overflow-hidden relative">
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Concentric pulsing radar waves */}
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75" />
              <div className="absolute inset-4 rounded-full bg-blue-50 animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex flex-col items-center justify-center shadow-lg">
                <Navigation className="w-8 h-8 animate-bounce text-teal-300" />
                <span className="text-[9px] font-black uppercase tracking-wider text-teal-200 mt-1">Radar</span>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Contacting Available Technicians
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                We are searching for top-rated, certified technicians within 10 km of <strong className="text-slate-800">{booking.city}</strong>.
              </p>
            </div>

            {/* Waiting duration indicator */}
            <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Matching time: {searchingSeconds}s</span>
            </div>

            {/* Service Summary snippet */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{booking.title}</span>
                <span className="text-blue-600">Rs. {booking.calloutFeeLkr} Callout</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{booking.address}, {booking.city}</p>
            </div>

            {/* Cancel Action */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel Service Request
              </button>
            </div>
          </div>
        ) : (
          /* Live Location Map / Status Map Panel */
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Upper Map Simulation Viewport */}
            <div className="h-44 bg-gradient-to-b from-slate-200 via-blue-50 to-slate-100 relative overflow-hidden flex flex-col justify-between p-3">
              
              {/* Map grid lines aesthetic */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />

              {/* Map Top Status Pills */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GPS Tracking Active
                </span>

                <span className="bg-white/95 backdrop-blur-xs text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  Updated just now
                </span>
              </div>

              {/* Interactive Visual Map Pins */}
              <div className="relative z-10 flex items-center justify-around py-4">
                {/* Destination Customer Pin */}
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                    <MapPin className="w-5 h-5 fill-white" />
                  </div>
                  <span className="mt-1 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Your Address
                  </span>
                </div>

                {/* Connection Line / Travel vector */}
                <div className="flex-1 mx-3 flex items-center">
                  <div className="w-full h-1 border-t-2 border-dashed border-blue-500 relative flex items-center justify-center">
                    {(isOnTheWay || isInProgress) && (
                      <span className="absolute w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Technician Location Pin */}
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
                    isArrived || isInProgress || isCompleted ? 'bg-teal-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    <Navigation className="w-4 h-4 fill-white" />
                  </div>
                  <span className="mt-1 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    {booking.provider?.name?.split(' ')[0] || 'Technician'}
                  </span>
                </div>
              </div>

              {/* Map Footer Bar */}
              <div className="relative z-10 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[220px]">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold truncate text-[11px]">{booking.address}, {booking.city}</span>
                </div>
                <span className="text-[11px] font-extrabold text-blue-700 shrink-0">
                  {isOnTheWay ? '~2.4 km away' : (isArrived ? 'On site' : (isInProgress ? 'In progress' : 'Scheduled'))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. ASSIGNED PROVIDER CARD ==================== */}
        {booking.provider && !isPending && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Service Professional
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Pro
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-800 text-lg overflow-hidden shrink-0">
                  {booking.provider.avatarUrl ? (
                    <img src={booking.provider.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    booking.provider.name?.charAt(0) || 'P'
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{booking.provider.name}</h4>
                  <span className="text-xs text-slate-500 block">{booking.provider.businessName || 'Certified Technician'}</span>
                  
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="font-bold text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {booking.provider.rating || 4.9} ({booking.provider.reviewCount || 12})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-medium">
                      {booking.provider.completedJobsCount || 45} jobs finished
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Communication Action Buttons */}
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChat(booking.id)}
                className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Message Technician</span>
              </button>

              <a
                href={`tel:${booking.provider.phone}`}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Phone className="w-4 h-4 text-slate-700" />
                <span>Call</span>
              </a>
            </div>
          </div>
        )}

        {/* ==================== 5. 9-STAGE PROGRESS TIMELINE ==================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => setTimelineExpanded(!timelineExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Booking Progress Timeline
              </h3>
            </div>
            {timelineExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {timelineExpanded && (
            <div className="px-5 pb-5 pt-1 space-y-3.5 border-t border-slate-100">
              {stageStatuses.map((step, idx) => {
                const isLast = idx === stageStatuses.length - 1;
                return (
                  <div key={step.id} className="flex items-start gap-3 relative">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div className={`absolute left-3.5 top-6 bottom-[-14px] w-0.5 ${
                        step.done ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                    )}

                    {/* Step Icon Indicator */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      step.current
                        ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                        : step.done
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {step.done ? (
                        <Check className="w-4 h-4" />
                      ) : step.current ? (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      ) : (
                        <span className="text-[10px] font-bold">{step.id}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${
                          step.current ? 'text-blue-700' : step.done ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {step.title}
                        </h4>
                        {step.current && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.2 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${
                        step.current ? 'text-blue-900 font-medium' : step.done ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================== 6. PROPOSED EXTRA CHARGES ==================== */}
        {booking.additionalChargeProposals && booking.additionalChargeProposals.some((p: any) => p.status === 'PENDING_APPROVAL') && (
          <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-3xl space-y-2.5 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                Action Required: Additional Cost Proposal
              </h4>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              The technician discovered unforeseen work or replacement parts required to complete the repair. Please approve or decline below.
            </p>
            
            {booking.additionalChargeProposals.filter((p: any) => p.status === 'PENDING_APPROVAL').map((proposal: any) => (
              <div key={proposal.id} className="p-3 bg-white rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{proposal.category}</span>
                  <span className="font-extrabold text-amber-950 text-sm">
                    Rs. {proposal.amountLkr?.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic">"{proposal.description}"</p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleRespondToProposal(proposal.id, false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    Decline Extra
                  </button>
                  <button
                    onClick={() => handleRespondToProposal(proposal.id, true)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Approve Extra Charge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== 7. WORK COMPLETION SUMMARY (AWAITING CONFIRMATION) ==================== */}
        {isAwaitingConfirmation && (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-4 shadow-md space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm">Review Completed Work & Final Invoice</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your technician has marked all requested tasks as finished. Inspect the work before approving final sign-off.
            </p>

            {booking.completionNotes && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-0.5">Technician Completion Notes:</span>
                <p className="text-slate-600 italic">"{booking.completionNotes}"</p>
              </div>
            )}

            {booking.completionPhotos && booking.completionPhotos.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Completion Photos:</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {booking.completionPhotos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950">Payable Total:</span>
              <span className="text-base font-extrabold text-emerald-700">
                Rs. {booking.totalAmountLkr?.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowComplaintModal(true)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                Report a Problem
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmCompletionModal(true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Completion
              </button>
            </div>
          </div>
        )}

        {/* ==================== 8. TRANSPARENT PRICE DETAILS CARD ==================== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => setPriceDetailsExpanded(!priceDetailsExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Transparent Price Breakdown
              </h3>
            </div>
            {priceDetailsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {priceDetailsExpanded && (
            <div className="px-4 pb-4 pt-1 space-y-2 text-xs border-t border-slate-100 divide-y divide-slate-100">
              <div className="pt-2 flex justify-between text-slate-600">
                <span>Base Inspection & Callout Fee:</span>
                <span className="font-semibold text-slate-900">Rs. {booking.calloutFeeLkr?.toLocaleString()}</span>
              </div>

              <div className="pt-2 flex justify-between text-slate-600">
                <span>Labor Charges (On-site work):</span>
                <span className="font-semibold text-slate-900">
                  {booking.laborChargesLkr > 0 ? `Rs. ${booking.laborChargesLkr.toLocaleString()}` : 'Calculated upon completion'}
                </span>
              </div>

              <div className="pt-2 flex justify-between text-slate-600">
                <span>Materials & Replacement Parts:</span>
                <span className="font-semibold text-slate-900">
                  {booking.materialCostsLkr > 0 ? `Rs. ${booking.materialCostsLkr.toLocaleString()}` : 'None or provided by customer'}
                </span>
              </div>

              {booking.additionalCostsLkr > 0 && (
                <div className="pt-2 flex justify-between text-amber-700">
                  <span>Customer-Approved Extras:</span>
                  <span className="font-semibold">Rs. {booking.additionalCostsLkr.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 flex justify-between text-slate-600">
                <span>Travel Fee:</span>
                <span className="font-semibold text-slate-900">
                  {booking.travelFeeLkr > 0 ? `Rs. ${booking.travelFeeLkr.toLocaleString()}` : 'Included in base zone'}
                </span>
              </div>

              <div className="pt-3 flex justify-between font-extrabold text-sm text-slate-900">
                <span>{isCompleted ? 'Final Total Charged:' : 'Estimated / Current Total:'}</span>
                <span className="text-blue-600 font-extrabold text-base">
                  Rs. {booking.totalAmountLkr?.toLocaleString()}
                </span>
              </div>

              <p className="pt-2 text-[10px] text-slate-400 leading-relaxed italic">
                * All payments are documented in Sri Lankan Rupees (LKR). Additional costs require explicit customer confirmation before being billed.
              </p>
            </div>
          )}
        </div>

        {/* ==================== 9. SERVICE APPOINTMENT DETAILS ==================== */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <h4 className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">
            Appointment Information
          </h4>

          <div className="space-y-1.5 text-slate-600 pt-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Preferred Date: <strong>{booking.preferredDate}</strong> • {booking.preferredTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Address: <strong>{booking.address}, {booking.city}</strong></span>
            </div>

            {booking.description && (
              <div className="pt-1 text-slate-500 text-[11px]">
                <strong className="text-slate-700">Notes: </strong>"{booking.description}"
              </div>
            )}
          </div>
        </div>

        {/* ==================== 10. CONTEXTUAL ACTIONS & HELP ==================== */}
        <div className="space-y-2 pt-1 pb-4">
          {/* Cancelled state actions */}
          {isCancelled && (
            <div className="p-4 bg-slate-100 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-slate-700 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Service Booking Cancelled</span>
              </div>
              <p className="text-[11px] text-slate-500">
                This booking has been cancelled and closed. No cancellation fee was charged.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onReturnHome || onBack}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition"
                >
                  Return to Home
                </button>
                <button
                  type="button"
                  onClick={onBookAnother || onBack}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Book Another Service
                </button>
              </div>
            </div>
          )}

          {/* Rate & Review button if completed and not reviewed */}
          {isCompleted && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>Leave Technician Rating & Review</span>
            </button>
          )}

          {/* Cancel request button if eligible (PENDING or ACCEPTED) */}
          {(isPending || isAccepted) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-2xl font-bold text-xs border border-slate-200 transition"
            >
              Cancel Service Request
            </button>
          )}

          {/* Report an Issue trigger */}
          <button
            onClick={() => setShowComplaintModal(true)}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Need Help or Have an Issue with this Booking?</span>
          </button>
        </div>

      </div>

      {/* ==================== CONFIRM COMPLETION DIALOG ==================== */}
      {showConfirmCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Confirm Service Completion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify that the technician has tested the repair and left the workspace clean.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Final Payable Amount:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  Rs. {booking.totalAmountLkr?.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Payment confirmation will release the dispatch and register work warranty.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmCompletionModal(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <div className="flex-1">
                <ActionButton
                  type="button"
                  onClick={handleConfirmCompletion}
                  isLoading={isConfirmingCompletion}
                  loadingLabel="Releasing..."
                  label="Confirm & Sign Off"
                  variant="success"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CANCEL BOOKING DIALOG ==================== */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Cancel Service Request</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                {isPending 
                  ? 'Cancellation is free of charge while searching for a professional.'
                  : 'A provider has already accepted this job. Are you sure you want to cancel?'}
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="Change of schedule">Change of schedule</option>
                  <option value="Found alternative solution">Found alternative solution</option>
                  <option value="Need to reschedule for later date">Need to reschedule for later date</option>
                  <option value="Estimated price concern">Estimated price concern</option>
                  <option value="Entered incorrect address">Entered incorrect address</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Keep Request
              </button>
              <div className="flex-1">
                <ActionButton
                  type="button"
                  onClick={handleCancelBooking}
                  isLoading={isCancelling}
                  loadingLabel="Cancelling..."
                  label="Confirm Cancellation"
                  variant="danger"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RATING & REVIEW MODAL ==================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            {reviewSubmittedSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Thank You for Your Feedback!</h3>
                <p className="text-xs text-slate-500">Your review helps maintain quality standards across Sri Lanka.</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 fill-amber-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Rate Your Technician</h3>
                  <p className="text-xs text-slate-500">
                    How was your service experience with <strong>{booking.provider?.name || 'your technician'}</strong>?
                  </p>
                </div>

                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 hover:scale-125 transition"
                    >
                      <Star className={`w-8 h-8 ${star <= ratingScore ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>

                {/* Feedback tags */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 block">Feedback Highlights:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Professional',
                      'On time',
                      'Quality work',
                      'Good communication',
                      'Clean workspace',
                      'Fair pricing'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleReviewTag(tag)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition font-semibold ${
                          reviewTags.includes(tag)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tag} {reviewTags.includes(tag) && '✓'}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about punctuality, problem resolution, and overall satisfaction..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Skip
                  </button>
                  <div className="flex-1">
                    <ActionButton
                      type="button"
                      onClick={handleSubmitReview}
                      isLoading={isSubmittingReview}
                      disabled={!reviewComment.trim()}
                      loadingLabel="Submitting..."
                      label="Submit Review"
                      variant="primary"
                      size="sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== REPORT A PROBLEM / COMPLAINT MODAL ==================== */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-red-600">
                <AlertCircle className="w-4 h-4" />
                Report an Issue
              </h3>
              <button onClick={() => setShowComplaintModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Issue Category</label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="Provider has not arrived">Provider has not arrived</option>
                  <option value="Incorrect or unexpected price">Incorrect or unexpected price</option>
                  <option value="Work quality issue">Work quality issue</option>
                  <option value="Provider communication problem">Provider communication problem</option>
                  <option value="Safety concern">Safety concern</option>
                  <option value="Other issue">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Describe What Happened</label>
                <textarea
                  rows={4}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Please provide specific details so our support team can review and contact both parties..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Emergency mediation hotline is also available 24/7 at <a href="tel:+94112345678" className="text-blue-600 underline">+94 11 234 5678</a>.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <div className="flex-1">
                <ActionButton
                  type="button"
                  onClick={handleSubmitComplaint}
                  isLoading={isSubmittingComplaint}
                  disabled={!complaintText.trim()}
                  loadingLabel="Submitting..."
                  label="File Report"
                  variant="danger"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export { LiveServiceTracker as BookingProgressScreen };
