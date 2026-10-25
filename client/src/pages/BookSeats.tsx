import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Movie, Showtime, Booking } from '../types/index.js';
import { moviesApi, bookingsApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { SeatMap } from '../components/SeatMap.js';
import { TicketCard } from '../components/TicketCard.js';
import { RazorpayModal } from '../components/RazorpayModal.js';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const TIER_SURCHARGES: Record<string, number> = {
  A: 100,
  B: 100,
  C: 50,
  D: 50,
  E: 0,
  F: 0,
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const BookSeats: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [showDate, setShowDate] = useState<string>('');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('Razorpay (UPI, Cards, NetBanking)');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<{
    orderId: string;
    amount: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (id) {
      loadBookingDetails();
    }
  }, [id, searchParams]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await moviesApi.getById(id!);
      setMovie(res.movie);

      const targetShowtimeId = searchParams.get('showtimeId') || res.movie.showtimes[0]?._id;
      const targetDate = searchParams.get('showDate') || res.movie.showtimes[0]?.date;

      const foundShowtime = res.movie.showtimes.find((s) => s._id === targetShowtimeId) || res.movie.showtimes[0];

      setShowtime(foundShowtime);
      setShowDate(targetDate);

      // Fetch booked seats for this showtime & date
      if (foundShowtime && targetDate) {
        const seatsRes = await moviesApi.getSeats(id!, foundShowtime._id, targetDate);
        setBookedSeats(seatsRes.bookedSeats || []);
      }
    } catch (err) {
      console.error('Error loading booking data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeat = (seatId: string) => {
    setErrorMessage(null);
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 8) {
        setErrorMessage('Maximum 8 seats can be selected per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Calculate total price based on seats and tier surcharges
  const calculateTotal = () => {
    if (!showtime) return 0;
    const base = showtime.price;
    return selectedSeats.reduce((acc, seat) => {
      const row = seat.charAt(0);
      const surcharge = TIER_SURCHARGES[row] || 0;
      return acc + (base + surcharge);
    }, 0);
  };

  const handleRazorpaySuccess = async (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    method: string;
  }) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setIsRazorpayModalOpen(false);

      const res = await bookingsApi.verifyRazorpayPayment({
        movieId: id!,
        showtimeId: showtime!._id,
        showDate,
        seats: selectedSeats,
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        paymentMethod: paymentData.method || 'Razorpay (UPI / Card)',
      });

      setConfirmedBooking(res.booking);

      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#a78bfa', '#f59e0b', '#3b82f6', '#ffffff'],
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Payment verification failed. Some seats may have been taken.');
      if (showtime && showDate) {
        const seatsRes = await moviesApi.getSeats(id!, showtime._id, showDate);
        setBookedSeats(seatsRes.bookedSeats || []);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (isAdmin) {
      setErrorMessage('Administrators are not permitted to book tickets. Please use a moviegoer account.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: { pathname: `/movies/${id}/book?showtimeId=${showtime?._id}&showDate=${showDate}` },
        },
      });
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    const subtotal = calculateTotal();
    const bookingFee = selectedSeats.length > 0 ? 30 : 0;
    const grandTotal = subtotal + bookingFee;

    // RAZORPAY PAYMENT FLOW
    if (paymentMethod.startsWith('Razorpay')) {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);

        const orderRes = await bookingsApi.createRazorpayOrder({
          movieId: id!,
          showtimeId: showtime!._id,
          showDate,
          seats: selectedSeats,
        });

        // If sandbox simulated or fallback mode, open custom Razorpay Indian gateway modal
        if (orderRes.isSimulated || orderRes.order?.isSimulated) {
          setRazorpayOrderData({
            orderId: orderRes.order.id,
            amount: grandTotal,
          });
          setIsRazorpayModalOpen(true);
          setIsSubmitting(false);
          return;
        }

        // Try standard Razorpay checkout.js
        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded && (window as any).Razorpay) {
          try {
            const options = {
              key: orderRes.keyId,
              amount: orderRes.order.amount,
              currency: orderRes.currency || 'INR',
              name: 'CinePass India',
              description: `${movie?.title} • Seats: ${selectedSeats.join(', ')}`,
              image: movie?.posterUrl || '',
              order_id: orderRes.order.id,
              handler: async function (response: any) {
                await handleRazorpaySuccess({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  method: 'Razorpay Official Checkout',
                });
              },
              prefill: {
                name: user?.name || '',
                email: user?.email || '',
              },
              notes: {
                movie: movie?.title || '',
                seats: selectedSeats.join(', '),
              },
              theme: {
                color: '#7c3aed',
              },
              modal: {
                ondismiss: function () {
                  setIsSubmitting(false);
                },
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (resp: any) {
              setErrorMessage(resp.error?.description || 'Razorpay payment was declined.');
              setIsSubmitting(false);
            });
            rzp.open();
            return;
          } catch (sdkError) {
            console.warn('Razorpay SDK error, falling back to built-in gateway modal:', sdkError);
          }
        }

        // Fallback to built-in gateway modal
        setRazorpayOrderData({
          orderId: orderRes.order.id,
          amount: grandTotal,
        });
        setIsRazorpayModalOpen(true);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to initiate Razorpay order.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // DIRECT DEMO BOOKING FLOW
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await bookingsApi.create({
        movieId: id!,
        showtimeId: showtime!._id,
        showDate,
        seats: selectedSeats,
        paymentMethod,
      });

      setConfirmedBooking(res.booking);

      // Trigger celebration confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#a78bfa', '#f59e0b', '#3b82f6', '#ffffff'],
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Booking failed. Some seats may have been taken.');
      // Refresh booked seats
      if (showtime && showDate) {
        const seatsRes = await moviesApi.getSeats(id!, showtime._id, showDate);
        setBookedSeats(seatsRes.bookedSeats || []);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-4" />
        <p className="text-xs text-slate-500">Loading cinema auditorium seat map...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
            ADMIN RESTRICTION
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Ticket Booking Restricted for Administrators
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            You are currently logged in with an <strong>Administrator</strong> account. As an administrator, you cannot book tickets or reserve seats. Please log in with a standard moviegoer account to purchase tickets, or access your Admin Portal to inspect collections and movie records.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/admin"
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/25 transition-all hover:scale-105"
          >
            Go to Admin Dashboard
          </Link>
          <Link
            to="/movies"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  if (!movie || !showtime) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Showtime Unavailable</h2>
        <p className="text-xs text-slate-500 mb-6">Please choose another movie or date.</p>
        <Link to="/movies" className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/25">
          Back to Movies
        </Link>
      </div>
    );
  }

  const subtotal = calculateTotal();
  const bookingFee = selectedSeats.length > 0 ? 30 : 0;
  const grandTotal = subtotal + bookingFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={`/movies/${movie._id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Film Overview</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{movie.title}</span>
          <span>•</span>
          <span className="text-violet-600 font-bold">{showtime.time}</span>
        </div>
      </div>

      {/* Confirmation Modal if Booking was successful */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Confirmed!</h2>
              <p className="text-xs text-slate-500">
                Your movie ticket has been issued. A confirmation is saved to your account.
              </p>
            </div>

            {/* Generated Ticket Stub */}
            <TicketCard booking={confirmedBooking} />

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/my-bookings"
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/25 transition-all"
              >
                Go to My Tickets
              </Link>
              <button
                type="button"
                onClick={() => {
                  setConfirmedBooking(null);
                  setSelectedSeats([]);
                  navigate('/');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Seat Map on Left, Checkout Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Auditorium Map */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Auditorium Seating</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Click on available chairs to pick your spot. Up to 8 seats per booking.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100 text-xs">
              <MapPin className="w-3.5 h-3.5 text-violet-600" />
              <span className="font-bold text-violet-900">{showtime.screen}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Interactive Seat Map */}
          <div className="py-4">
            <SeatMap
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
              basePrice={showtime.price}
            />
          </div>
        </div>

        {/* Right 1 Col: Booking & Checkout Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Booking Summary
            </h3>

            {/* Movie Info Snippet */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-14 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{movie.title}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{showDate}</span>
                </div>
                <div className="text-xs text-violet-600 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{showtime.time}</span>
                </div>
              </div>
            </div>

            {/* Selected Seats Pills */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Selected Seats ({selectedSeats.length})
              </span>
              {selectedSeats.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No seats selected yet. Click chairs on the map.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="bg-violet-50 text-violet-700 border border-violet-200 text-xs font-extrabold px-2.5 py-1 rounded-xl"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Tickets Subtotal</span>
                <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Convenience & Booking Fee</span>
                <span className="font-bold text-slate-800">₹{bookingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-violet-700 font-mono text-base font-black">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Payment Gateway</span>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Indian Rupee (INR)</span>
              </label>

              {/* Razorpay Gateway Card */}
              <div
                onClick={() => setPaymentMethod('Razorpay (UPI, Cards, NetBanking)')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod.startsWith('Razorpay')
                    ? 'border-[#3395ff] bg-blue-50/50 ring-2 ring-[#3395ff]/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0c2340] text-[#3395ff] flex items-center justify-center font-black text-xs shadow-sm">
                      R
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900">Razorpay Gateway</span>
                      <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md">
                        Fast & Secure
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod.startsWith('Razorpay')}
                    onChange={() => setPaymentMethod('Razorpay (UPI, Cards, NetBanking)')}
                    className="accent-[#3395ff] w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 pl-8">
                  <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-emerald-700">UPI / QR</span>
                  <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-blue-700">Google Pay</span>
                  <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-violet-700">PhonePe</span>
                  <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700">RuPay & Cards</span>
                </div>
              </div>

              {/* Instant Direct Demo Simulation */}
              <div
                onClick={() => setPaymentMethod('Direct Demo Simulation')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'Direct Demo Simulation'
                    ? 'border-violet-600 bg-violet-50/40 ring-2 ring-violet-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Instant Demo Simulation</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'Direct Demo Simulation'}
                    onChange={() => setPaymentMethod('Direct Demo Simulation')}
                    className="accent-violet-600 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                👑 <strong>Admin Account:</strong> Ticket booking is restricted to customer accounts.
              </div>
            )}

            {/* Checkout Action */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedSeats.length === 0 || isSubmitting || isAdmin}
              className={`w-full py-3.5 px-4 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 ${
                paymentMethod.startsWith('Razorpay')
                  ? 'bg-[#3395ff] hover:bg-[#2080ea] shadow-blue-500/25'
                  : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Payment...</span>
                </>
              ) : isAdmin ? (
                <span>Admin Booking Restricted</span>
              ) : (
                <>
                  {paymentMethod.startsWith('Razorpay') ? (
                    <>
                      <div className="w-5 h-5 rounded bg-[#0c2340] text-[#3395ff] flex items-center justify-center font-black text-xs">
                        R
                      </div>
                      <span>
                        {isAuthenticated ? `Pay ₹${grandTotal.toFixed(2)} with Razorpay` : 'Sign In to Reserve'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isAuthenticated ? `Pay ₹${grandTotal.toFixed(2)} & Book` : 'Sign In to Reserve'}
                      </span>
                    </>
                  )}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Encrypted & Safe Razorpay Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Interactive Modal (For sandbox & instant high-fidelity payment) */}
      {razorpayOrderData && (
        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          onClose={() => {
            setIsRazorpayModalOpen(false);
            setIsSubmitting(false);
          }}
          orderId={razorpayOrderData.orderId}
          amount={razorpayOrderData.amount}
          movieTitle={movie.title}
          seats={selectedSeats}
          userEmail={user?.email || ''}
          userName={user?.name || ''}
          onPaymentSuccess={handleRazorpaySuccess}
        />
      )}
    </div>
  );
};
