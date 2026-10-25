import React, { useEffect, useState } from 'react';
import { Booking } from '../types/index.js';
import { bookingsApi } from '../api/client.js';
import { TicketCard } from '../components/TicketCard.js';
import { RatingModal } from '../components/RatingModal.js';
import { Ticket, Film, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    movieId: string;
    movieTitle: string;
  }>({
    isOpen: false,
    movieId: '',
    movieTitle: '',
  });

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getMyBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Error fetching my bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRate = (movieId: string, movieTitle: string) => {
    setRatingModal({
      isOpen: true,
      movieId,
      movieTitle,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-violet-600" />
            <span>My Movie Tickets</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your active cinema passes, download or print tickets, and rate past movies
          </p>
        </div>

        <Link
          to="/movies"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl shadow-sm transition-colors"
        >
          Book Another Movie
        </Link>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading your booked tickets...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <Film className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Tickets Booked Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't reserved any cinema seats. Browse our blockbuster lineup and reserve your first show!
            </p>
          </div>
          <Link
            to="/movies"
            className="inline-block px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/25 transition-transform hover:scale-105"
          >
            Explore Now Showing
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <TicketCard key={booking._id} booking={booking} onRateClick={handleOpenRate} />
          ))}
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, movieId: '', movieTitle: '' })}
        movieId={ratingModal.movieId}
        movieTitle={ratingModal.movieTitle}
        onRatingSuccess={() => {
          fetchMyBookings();
        }}
      />
    </div>
  );
};
