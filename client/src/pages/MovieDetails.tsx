import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Movie, Review, Showtime } from '../types/index.js';
import { moviesApi, reviewsApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { RatingModal } from '../components/RatingModal.js';
import {
  Star,
  Clock,
  Calendar,
  Ticket,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Showtime selection state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);

  useEffect(() => {
    if (id) {
      loadMovieDetails(id);
      loadReviews(id);
    }
  }, [id]);

  const loadMovieDetails = async (movieId: string) => {
    try {
      setLoading(true);
      const res = await moviesApi.getById(movieId);
      setMovie(res.movie);

      // Initialize selected date to first available date
      if (res.movie?.showtimes && res.movie.showtimes.length > 0) {
        const firstDate = res.movie.showtimes[0].date;
        setSelectedDate(firstDate);
        setSelectedShowtime(res.movie.showtimes[0]);
      }
    } catch (err) {
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (movieId: string) => {
    try {
      const res = await reviewsApi.getByMovie(movieId);
      setReviews(res.reviews || []);
      if (res.distribution) {
        setDistribution(res.distribution);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-500">Loading film details and showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Movie Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The movie you requested could not be located.</p>
        <Link to="/movies" className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20">
          Back to Movies
        </Link>
      </div>
    );
  }

  // Get distinct showtime dates
  const uniqueDates = Array.from(new Set(movie.showtimes.map((s) => s.date))).sort();
  const dateShowtimes = movie.showtimes.filter((s) => s.date === selectedDate);

  const handleBookNow = () => {
    if (isAdmin) {
      alert('Administrators are not permitted to book tickets.');
      return;
    }
    if (!selectedShowtime) return;
    navigate(`/movies/${movie._id}/book?showtimeId=${selectedShowtime._id}&showDate=${selectedDate}`);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Breadcrumb & Hero Backdrop */}
      <div className="relative w-full overflow-hidden bg-slate-950 border-b border-slate-200">
        {/* Backdrop Image */}
        <div className="absolute inset-0 opacity-30">
          <img
            src={movie.bannerUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover blur-md scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <Link
            to="/movies"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white mb-6 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Movies</span>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Poster Card */}
            <div className="md:col-span-1 aspect-[2/3] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Movie Synopsis & Key Info */}
            <div className="md:col-span-3 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {movie.genre.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-400/30"
                  >
                    {g}
                  </span>
                ))}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/20">
                  {movie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-200 py-3 border-y border-white/10">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm">{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'} / 5.0</span>
                  <span className="text-slate-400 font-normal">({movie.ratingCount} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{movie.duration} Minutes</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{new Date(movie.releaseDate).toLocaleDateString()}</span>
                </div>

                <div className="text-violet-400 font-black text-sm">
                  Base Price: ₹{movie.ticketPrice}
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Synopsis
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
                  {movie.description}
                </p>
              </div>

              {/* Director & Cast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                    Director
                  </span>
                  <span className="text-sm text-white font-semibold">{movie.director}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                    Starring Cast
                  </span>
                  <span className="text-sm text-slate-200">{movie.cast.join(', ') || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Showtimes & Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Showtime Picker & Book Tickets */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-violet-600" />
                  <span>Select Date & Showtime</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pick your preferred showtime to proceed to the interactive seat layout.
                </p>
              </div>
            </div>

            {/* Date Tabs */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
              {uniqueDates.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const isSelected = selectedDate === dateStr;
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      const firstOnDate = movie.showtimes.find((s) => s.date === dateStr);
                      setSelectedShowtime(firstOnDate || null);
                    }}
                    className={`flex flex-col items-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/30 scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{weekday}</span>
                    <span className="text-sm font-black mt-0.5">{dayNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Available Showtimes on this date */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Available Screens & Times
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dateShowtimes.map((st) => {
                  const isSelected = selectedShowtime?._id === st._id;

                  return (
                    <button
                      key={st._id}
                      type="button"
                      onClick={() => setSelectedShowtime(st)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-violet-50 border-violet-500 text-slate-900 ring-2 ring-violet-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-white'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-base text-slate-900">{st.time}</div>
                        <div className="text-xs text-violet-600 font-bold mt-0.5">{st.screen}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {st.totalSeats} Total Seats Capacity
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-violet-700 block">₹{st.price}</span>
                        <span className="text-[10px] text-slate-400 uppercase">per ticket</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Proceed Action Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Selected Showtime</span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedShowtime ? `${selectedShowtime.time} • ${selectedShowtime.screen}` : 'None'}
                </span>
              </div>

              {isAdmin ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                    👑 Admin Account: Ticket booking is restricted.
                  </div>
                  <Link
                    to={`/admin?movieId=${movie._id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all hover:scale-105"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                    <span>View Performance</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={!selectedShowtime}
                  className="flex items-center gap-2 px-7 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <span>Select Seats</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* User Reviews & Ratings Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  <span>Audience Reviews & Ratings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  See what fellow moviegoers thought of {movie.title}
                </p>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setIsRatingModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 shadow-sm transition-all hover:scale-105"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>Write a Review</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-semibold text-violet-600 hover:underline"
                >
                  Sign in to leave a review
                </Link>
              )}
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No reviews yet</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Be the first to watch and review this blockbuster!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-bold text-violet-700">
                          {rev.userName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{rev.userName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= st ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Rating Breakdown & Technology Badges */}
        <div className="space-y-6">
          {/* Overall Rating Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
              Audience Scorecard
            </h4>

            <div className="flex items-center gap-4 py-2">
              <div className="text-4xl font-black text-amber-500 font-mono">
                {movie.rating > 0 ? movie.rating.toFixed(1) : '5.0'}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        (movie.rating || 5) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">
                  Based on {movie.ratingCount || reviews.length} verified ratings
                </span>
              </div>
            </div>

            {/* Rating distribution bars */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = distribution[stars] || 0;
                const total = reviews.length || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={stars} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-5 text-right font-bold text-slate-700">{stars}★</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cinema Technologies Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600">
            <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider">
              Cinema Experience
            </h4>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dolby Atmos Spatial Audio</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dual 4K Laser Projection</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Comfort Plush & Recliner Options</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        movieId={movie._id}
        movieTitle={movie.title}
        onRatingSuccess={() => {
          loadMovieDetails(movie._id);
          loadReviews(movie._id);
        }}
      />
    </div>
  );
};
