import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types/index.js';
import { moviesApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { MovieCard } from '../components/MovieCard.js';
import { Sparkles, Search, Star, Ticket, ShieldCheck, Film, TrendingUp } from 'lucide-react';

const GENRES = ['All', 'Sci-Fi', 'Action', 'Adventure', 'Drama', 'Cyberpunk', 'Documentary'];

export const Home: React.FC = () => {
  const { isAdmin } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await moviesApi.getAll({
        genre: selectedGenre !== 'All' ? selectedGenre : undefined,
      });
      setMovies(res.movies || []);
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((m) =>
    searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cast.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const heroMovie = movies[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      {heroMovie && (
        <section className="relative w-full h-[65vh] min-h-[480px] max-h-[700px] overflow-hidden rounded-b-3xl sm:rounded-3xl max-w-7xl mx-auto border-b sm:border border-slate-200 shadow-xl">
          {/* Background Banner Image */}
          <img
            src={heroMovie.bannerUrl || heroMovie.posterUrl}
            alt={heroMovie.title}
            className="w-full h-full object-cover object-center scale-105"
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-violet-950">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Spotlight
              </span>
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{heroMovie.rating.toFixed(1)}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              {heroMovie.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 line-clamp-3 mb-6 leading-relaxed max-w-2xl">
              {heroMovie.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <Link
                  to={`/admin?movieId=${heroMovie._id}`}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-violet-600/40 transition-all hover:scale-105"
                >
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                  <span>View Performance</span>
                </Link>
              ) : (
                <Link
                  to={`/movies/${heroMovie._id}/book`}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-violet-600/40 transition-all hover:scale-105"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets</span>
                </Link>
              )}

              <Link
                to={`/movies/${heroMovie._id}`}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-5 py-3 rounded-xl backdrop-blur-md border border-white/20 transition-colors"
              >
                <span>Movie Details</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, director, cast..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 focus:bg-white"
            />
          </div>

          {/* Genre Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGenre === g
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Now Showing in Theatres</span>
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your favorite movie, pick your preferred seats, and enjoy the cinema!
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredMovies.length} Available
          </span>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[2/3] bg-white rounded-2xl animate-pulse border border-slate-200 shadow-sm"
              />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Movies Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or genre filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Two-Factor OTP Security</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Logins and registrations are validated with 6-digit one-time codes to guarantee account protection.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Verified Audience Ratings</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Read authentic ratings and submit your own reviews for films after experiencing them on the big screen.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Instant Interactive e-Tickets</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose your exact seats on our live auditorium map and receive digital tickets with QR codes immediately.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
