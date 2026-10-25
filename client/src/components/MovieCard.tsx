import React from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { Star, Clock, Ticket, TrendingUp } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { isAdmin } = useAuth();

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-400 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 flex flex-col">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback poster image if URL fails
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-70" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-300 text-xs font-bold shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{movie.rating > 0 ? movie.rating.toFixed(1) : 'New'}</span>
            {movie.ratingCount > 0 && (
              <span className="text-[10px] text-slate-300 font-normal">({movie.ratingCount})</span>
            )}
          </div>

          <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-semibold text-slate-200 border border-white/20">
            {movie.language}
          </span>
        </div>

        {/* Price tag over poster */}
        <div className="absolute bottom-3 right-3 bg-violet-600/95 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
          ₹{movie.ticketPrice}
        </div>
      </div>

      {/* Movie Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {movie.duration}m
            </span>
            <span>•</span>
            <span className="truncate">{movie.genre.slice(0, 2).join(', ')}</span>
          </div>

          <h3 className="font-bold text-base text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {movie.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/movies/${movie._id}`}
            className="flex-1 text-center py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-colors"
          >
            Details
          </Link>

          {isAdmin ? (
            <Link
              to={`/admin?movieId=${movie._id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all hover:scale-[1.02]"
              title="Click to view this movie's performance, collections, and showtimes records"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>View Performance</span>
            </Link>
          ) : (
            <Link
              to={`/movies/${movie._id}/book`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/20 transition-all hover:scale-[1.02]"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Book</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
