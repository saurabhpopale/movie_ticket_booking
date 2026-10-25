import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AdminDashboardData, AdminMovieStat, Showtime } from '../../types/index.js';
import { adminApi, moviesApi } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  IndianRupee,
  Ticket,
  Film,
  Star,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  X,
  TrendingUp,
  Plus,
  Search,
  Power,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [movieSearch, setMovieSearch] = useState<string>('');
  const [movieFilter, setMovieFilter] = useState<'all' | 'my' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'totalCollection' | 'last2Days' | 'ticketsSold' | 'rating'>('totalCollection');

  // Bookings table filter: all or last2Days
  const [bookingFilter, setBookingFilter] = useState<'all' | 'last2Days'>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');

  // Modals
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState<boolean>(false);
  const [selectedMovieForRecord, setSelectedMovieForRecord] = useState<AdminMovieStat | null>(null);

  // Add Movie Form State
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    posterUrl: '',
    bannerUrl: '',
    trailerUrl: '',
    genre: 'Action, Sci-Fi',
    language: 'Hindi',
    duration: 140,
    releaseDate: new Date().toISOString().split('T')[0],
    director: '',
    cast: '',
    ticketPrice: 250,
  });
  const [isSubmittingMovie, setIsSubmittingMovie] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-open movie record modal if movieId query param exists
  useEffect(() => {
    const movieIdParam = searchParams.get('movieId');
    if (movieIdParam && data?.movieStats) {
      const foundMovie = data.movieStats.find((m) => m._id === movieIdParam);
      if (foundMovie) {
        setSelectedMovieForRecord(foundMovie);
      }
    }
  }, [searchParams, data]);

  const handleCloseMovieRecord = () => {
    setSelectedMovieForRecord(null);
    if (searchParams.get('movieId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('movieId');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the theater? This cannot be undone.`)) {
      return;
    }
    try {
      await moviesApi.delete(movieId);
      setSuccessMessage(`Movie "${title}" removed successfully.`);
      if (selectedMovieForRecord?._id === movieId) {
        setSelectedMovieForRecord(null);
      }
      fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete movie.');
    }
  };

  const handleToggleStatus = async (movieId: string, currentStatus: boolean, title: string) => {
    try {
      await moviesApi.toggleStatus(movieId);
      setSuccessMessage(`Movie "${title}" is now ${!currentStatus ? 'Active' : 'Inactive'}.`);
      fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to toggle movie status.');
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.title || !newMovie.description || !newMovie.posterUrl || !newMovie.ticketPrice) {
      setErrorMessage('Please fill in required fields: Title, Description, Poster URL, and Ticket Price.');
      return;
    }

    try {
      setIsSubmittingMovie(true);
      setErrorMessage(null);

      // Auto-generate showtimes for the next 5 days
      const today = new Date();
      const generatedShowtimes: Showtime[] = [];
      const times = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];

      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        times.forEach((t, idx) => {
          generatedShowtimes.push({
            date: dateStr,
            time: t,
            screen: idx % 2 === 0 ? 'Screen 1 (IMAX Laser)' : 'Screen 2 (Dolby Atmos)',
            price: Number(newMovie.ticketPrice),
            totalSeats: 60,
          } as any);
        });
      }

      await moviesApi.create({
        ...newMovie,
        duration: Number(newMovie.duration),
        ticketPrice: Number(newMovie.ticketPrice),
        genre: newMovie.genre.split(',').map((g) => g.trim()).filter(Boolean),
        cast: newMovie.cast.split(',').map((c) => c.trim()).filter(Boolean),
        showtimes: generatedShowtimes,
      });

      setSuccessMessage(`Movie "${newMovie.title}" successfully added to your catalog!`);
      setIsAddMovieModalOpen(false);
      setNewMovie({
        title: '',
        description: '',
        posterUrl: '',
        bannerUrl: '',
        trailerUrl: '',
        genre: 'Action, Sci-Fi',
        language: 'Hindi',
        duration: 140,
        releaseDate: new Date().toISOString().split('T')[0],
        director: '',
        cast: '',
        ticketPrice: 250,
      });
      fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to add movie.');
    } finally {
      setIsSubmittingMovie(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading box office analytics, collections, and movie records...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalBookings: 0,
    totalMovies: 0,
    last2DaysRevenue: 0,
    last2DaysTicketsSold: 0,
    last2DaysBookingsCount: 0,
    todayRevenue: 0,
    todayTicketsSold: 0,
    todayBookingsCount: 0,
    yesterdayRevenue: 0,
    yesterdayTicketsSold: 0,
    yesterdayBookingsCount: 0,
  };

  // Filter and sort movies
  const movieStats = data?.movieStats || [];
  const filteredMovies = movieStats
    .filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
        m.genre.some((g) => g.toLowerCase().includes(movieSearch.toLowerCase())) ||
        (m.director && m.director.toLowerCase().includes(movieSearch.toLowerCase()));

      if (!matchesSearch) return false;

      if (movieFilter === 'my') {
        return m.isCreatedByMe || (m.createdBy && m.createdBy === user?.id);
      }
      if (movieFilter === 'active') {
        return m.isActive;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'totalCollection') return b.collection - a.collection;
      if (sortBy === 'last2Days') return b.last2DaysCollection - a.last2DaysCollection;
      if (sortBy === 'ticketsSold') return b.ticketsSold - a.ticketsSold;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  // Filter bookings
  const recentBookings = data?.recentBookings || [];
  const filteredBookings = recentBookings.filter((b) => {
    if (bookingFilter === 'last2Days' && !b.isLast2Days) {
      return false;
    }
    if (bookingSearch) {
      const q = bookingSearch.toLowerCase();
      return (
        b.bookingId.toLowerCase().includes(q) ||
        b.userName.toLowerCase().includes(q) ||
        b.userEmail.toLowerCase().includes(q) ||
        b.movieTitle.toLowerCase().includes(q) ||
        b.screen.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Admin Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-black uppercase tracking-wider">
              ADMIN CONTROL PANEL
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              👑 {user?.name || 'Administrator'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
            Cinema Analytics & Box Office
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor all-time total collections, track last 2 days movie box office revenue, inspect current movie showtimes records, and manage screening schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh Box Office Data"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/post-movie"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Movie</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between animate-fade-in">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary KPI Metrics: Total Collection Till Now & Last 2 Days Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Collection Till Now */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Collection Till Now
              </span>
              <span className="text-3xl font-black text-slate-900 font-mono block tracking-tight">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>All-Time Gross Box Office</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.totalTicketsSold} tickets sold</span>
            <span>{stats.totalBookings} orders confirmed</span>
          </div>
        </div>

        {/* Metric 2: Last 2 Days Collections */}
        <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Last 2 Days Collections
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <span className="text-3xl font-black text-amber-600 font-mono block tracking-tight">
                ₹{stats.last2DaysRevenue.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{stats.last2DaysTicketsSold} tickets sold (Past 48h)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Today: ₹{stats.todayRevenue.toLocaleString('en-IN')}</span>
            <span>Yesterday: ₹{stats.yesterdayRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 3: Tickets / Seats Sold */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Tickets Sold
              </span>
              <span className="text-3xl font-black text-violet-700 font-mono block">
                {stats.totalTicketsSold}
              </span>
              <span className="text-[11px] text-slate-500">Across IMAX & Dolby screens</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
              <Ticket className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{stats.last2DaysTicketsSold} purchased in last 2 days</span>
          </div>
        </div>

        {/* Metric 4: Active Movies in Circulation */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Movies Current Records
              </span>
              <span className="text-3xl font-black text-indigo-700 font-mono block">
                {stats.totalMovies}
              </span>
              <span className="text-[11px] text-slate-500">Under cinema management</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Film className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>{movieStats.filter((m) => m.isActive).length} currently active for booking</span>
          </div>
        </div>
      </div>

      {/* Last 2 Days Collections Spotlight Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-lg font-black text-slate-900">Last 2 Days Box Office Collections</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of ticket revenues collected over the last 2 calendar days / past 48 hours.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-xs">
              2-Day Total: ₹{stats.last2DaysRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Today's Collection Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-700">Day 1: Today</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Live Today
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{stats.todayTicketsSold} tickets sold</span>
              <span>{stats.todayBookingsCount} bookings</span>
            </div>
          </div>

          {/* Yesterday's Collection Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-700">Day 2: Yesterday</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                Yesterday
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{stats.yesterdayRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>{stats.yesterdayTicketsSold} tickets sold</span>
              <span>{stats.yesterdayBookingsCount} bookings</span>
            </div>
          </div>

          {/* Combined 2-Day Efficiency Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase tracking-wider text-slate-700">2-Day Share of Total</span>
              <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-bold">
                Box Office Ratio
              </span>
            </div>
            <div className="text-2xl font-black text-violet-700 font-mono">
              {stats.totalRevenue > 0
                ? `${((stats.last2DaysRevenue / stats.totalRevenue) * 100).toFixed(1)}%`
                : '0.0%'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>₹{stats.last2DaysRevenue.toLocaleString('en-IN')} of ₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
              <span>{stats.last2DaysTicketsSold} total seats</span>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Current Records Table & Management */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Table Header and Filters */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Movies Current Records & Collections</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect each movie's current performance, all-time total collection, last 2 days collection, and showtimes schedule.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMovieModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Movie Record</span>
            </button>
          </div>

          {/* Search, Filter Pills, and Sorting */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
                placeholder="Search movie title, director, genre..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white"
              />
            </div>

            {/* Filter Tabs & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMovieFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    movieFilter === 'all' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({movieStats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMovieFilter('my')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    movieFilter === 'my' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Added Movies ({movieStats.filter((m) => m.isCreatedByMe).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMovieFilter('active')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    movieFilter === 'active' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({movieStats.filter((m) => m.isActive).length})
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-600"
                >
                  <option value="totalCollection">Sort: Total Collection</option>
                  <option value="last2Days">Sort: Last 2 Days Collection</option>
                  <option value="ticketsSold">Sort: Tickets Sold</option>
                  <option value="rating">Sort: Audience Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Movie Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-6">Movie Record</th>
                <th className="py-4 px-4">Ticket Price</th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1 text-amber-700">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Last 2 Days Collection</span>
                  </div>
                </th>
                <th className="py-4 px-4">
                  <div className="flex items-center gap-1 text-slate-800">
                    <IndianRupee className="w-3 h-3 text-emerald-600" />
                    <span>Total Collection Till Now</span>
                  </div>
                </th>
                <th className="py-4 px-4">Tickets Sold</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No movies match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-violet-50/30 transition-colors">
                    {/* Movie info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{movie.title}</span>
                            {movie.isCreatedByMe && (
                              <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200 text-[9px] font-black uppercase">
                                My Movie
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {movie.genre.slice(0, 3).join(', ')} • {movie.duration || 120}m • {movie.showtimesCount} Showtimes
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 text-[11px] font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{movie.rating > 0 ? movie.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-slate-400 font-normal">({movie.ratingCount})</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ticket Price */}
                    <td className="py-4 px-4 font-mono font-semibold text-slate-800">
                      ₹{movie.ticketPrice}
                    </td>

                    {/* Last 2 Days Collection */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-amber-600 text-sm block">
                          ₹{movie.last2DaysCollection.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold block">
                          {movie.last2DaysTicketsSold} seats in last 2 days
                        </span>
                        <div className="text-[9px] text-slate-400">
                          Today: ₹{movie.todayCollection.toLocaleString('en-IN')} | Yest: ₹{movie.yesterdayCollection.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </td>

                    {/* Total Collection Till Now */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-emerald-600 text-sm block">
                          ₹{movie.collection.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          All-time gross revenue
                        </span>
                      </div>
                    </td>

                    {/* Tickets Sold */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm">{movie.ticketsSold}</span>
                        <span className="text-slate-400 block text-[10px]">
                          {movie.totalBookings} orders
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(movie._id, movie.isActive, movie.title)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          movie.isActive
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{movie.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMovieForRecord(movie)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all hover:scale-105"
                          title="View Movie Box Office Performance & Current Record"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Performance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMovie(movie._id, movie.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                          title="Delete Movie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record of Tickets & Customer Bookings */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Record of Customer Ticket Transactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete transaction audit log of ticket purchases and seat reservations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setBookingFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  bookingFilter === 'all' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Records ({recentBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter('last2Days')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  bookingFilter === 'last2Days'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Last 2 Days Only ({recentBookings.filter((b) => b.isLast2Days).length})</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search ticket, customer..."
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-4 px-6">Ticket ID</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Movie & Screen</th>
                <th className="py-4 px-4">Show Date & Time</th>
                <th className="py-4 px-4">Reserved Seats</th>
                <th className="py-4 px-4">Booking Time</th>
                <th className="py-4 px-6 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No ticket transaction records match the current view.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-violet-700">#{b.bookingId}</span>
                        {b.isLast2Days && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-black uppercase tracking-wider">
                            Last 2 Days
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 block">{b.userName}</span>
                      <span className="text-[10px] text-slate-400">{b.userEmail}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 block">{b.movieTitle}</span>
                      <span className="text-[10px] text-slate-500">{b.screen}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{b.showDate}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{b.showTime}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.seats.map((s) => (
                          <span
                            key={s}
                            className="bg-violet-50 text-violet-700 border border-violet-200 font-bold px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}
                    </td>

                    <td className="py-4 px-6 text-right font-mono font-black text-emerald-600 text-sm">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Movie Current Record Details */}
      {selectedMovieForRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMovieForRecord.posterUrl}
                  alt={selectedMovieForRecord.title}
                  className="w-16 h-24 object-cover rounded-2xl border border-slate-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                      <span>Movie Performance</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedMovieForRecord.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {selectedMovieForRecord.isActive ? 'Active Screening' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedMovieForRecord.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedMovieForRecord.genre.join(', ')} • Base Price: ₹{selectedMovieForRecord.ticketPrice}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseMovieRecord}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Collection</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  ₹{selectedMovieForRecord.collection.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">{selectedMovieForRecord.ticketsSold} tickets all-time</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Last 2 Days</span>
                <span className="text-lg font-black text-amber-600 font-mono">
                  ₹{selectedMovieForRecord.last2DaysCollection.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-700 block">
                  {selectedMovieForRecord.last2DaysTicketsSold} tickets
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Today's Box Office</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{selectedMovieForRecord.todayCollection.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Live today</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Yesterday</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{selectedMovieForRecord.yesterdayCollection.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Day -1</span>
              </div>
            </div>

            {/* Showtimes Schedule Record */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Showtimes Schedule ({selectedMovieForRecord.showtimes?.length || 0} Slots)
              </h4>

              {(!selectedMovieForRecord.showtimes || selectedMovieForRecord.showtimes.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No scheduled showtimes found for this movie.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Time</th>
                        <th className="py-2.5 px-4">Screen / Audi</th>
                        <th className="py-2.5 px-4">Price</th>
                        <th className="py-2.5 px-4 text-right">Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedMovieForRecord.showtimes.map((st, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono">{st.date}</td>
                          <td className="py-2.5 px-4 font-bold text-violet-600">{st.time}</td>
                          <td className="py-2.5 px-4">{st.screen}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">₹{st.price}</td>
                          <td className="py-2.5 px-4 text-right">{st.totalSeats || 60} seats</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Customer Bookings for this Movie */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Bookings For This Movie
                </h4>
                <span className="text-[11px] text-slate-400">
                  {recentBookings.filter((b) => b.movieId?.toString() === selectedMovieForRecord._id.toString() || b.movieTitle === selectedMovieForRecord.title).length} Orders Found
                </span>
              </div>

              {recentBookings.filter((b) => b.movieId?.toString() === selectedMovieForRecord._id.toString() || b.movieTitle === selectedMovieForRecord.title).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No bookings recorded yet for this movie.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Ticket ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Show Date & Time</th>
                        <th className="py-2.5 px-3">Seats</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {recentBookings
                        .filter((b) => b.movieId?.toString() === selectedMovieForRecord._id.toString() || b.movieTitle === selectedMovieForRecord.title)
                        .map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-violet-700">
                              #{b.bookingId}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-900 block">{b.userName}</span>
                              <span className="text-[10px] text-slate-400">{b.userEmail}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {b.showDate} • {b.showTime}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-wrap gap-1">
                                {b.seats.map((s) => (
                                  <span key={s} className="bg-violet-50 text-violet-700 font-bold px-1 py-0.5 rounded text-[9px] border border-violet-200">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                              ₹{b.totalAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedMovieForRecord._id, selectedMovieForRecord.isActive, selectedMovieForRecord.title)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                {selectedMovieForRecord.isActive ? 'Pause Screening' : 'Activate Screening'}
              </button>

              <button
                type="button"
                onClick={handleCloseMovieRecord}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-colors"
              >
                Close Performance Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Movie */}
      {isAddMovieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Movie to Theater Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register a new film with automatic 5-day IMAX & Dolby showtimes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMovieModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Movie Title *</label>
                  <input
                    type="text"
                    required
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                    placeholder="e.g. Kantara: Chapter 1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ticket Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newMovie.ticketPrice}
                    onChange={(e) => setNewMovie({ ...newMovie, ticketPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Synopsis *</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.description}
                  onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                  placeholder="Compelling overview of the film..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Poster Image URL *</label>
                  <input
                    type="url"
                    required
                    value={newMovie.posterUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Banner / Backdrop URL (Optional)</label>
                  <input
                    type="url"
                    value={newMovie.bannerUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, bannerUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={newMovie.genre}
                    onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                    placeholder="Action, Sci-Fi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Language</label>
                  <input
                    type="text"
                    value={newMovie.language}
                    onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                    placeholder="English"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    value={newMovie.duration}
                    onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Director</label>
                  <input
                    type="text"
                    value={newMovie.director}
                    onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
                    placeholder="Director Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Main Cast (comma separated)</label>
                  <input
                    type="text"
                    value={newMovie.cast}
                    onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
                    placeholder="Actor 1, Actor 2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 text-[11px] text-violet-900 space-y-1">
                <span className="font-bold text-violet-950 block">Automatic Showtimes Generation:</span>
                <span>Adding this movie automatically provisions 4 daily showtimes across Screen 1 (IMAX) and Screen 2 (Dolby Atmos) for the next 5 days.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMovieModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMovie}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-violet-600/20"
                >
                  {isSubmittingMovie ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isSubmittingMovie ? 'Saving Record...' : 'Publish Movie Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
