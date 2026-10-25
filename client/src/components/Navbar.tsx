import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { adminApi } from '../api/client.js';
import { Film, Ticket, LogOut, User as UserIcon, Menu, X, ShieldAlert, IndianRupee, Plus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAdmin) {
      adminApi
        .getDashboard()
        .then((res) => {
          if (res?.stats?.totalRevenue !== undefined) {
            setTotalRevenue(res.stats.totalRevenue);
          }
        })
        .catch((err) => {
          console.error('Navbar failed to load total collection:', err);
        });
    }
  }, [isAdmin, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-violet-100 shadow-sm shadow-violet-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-violet-950 to-violet-700 bg-clip-text text-transparent">
                CinePass
              </span>
              <span className="text-[10px] tracking-widest text-violet-600/80 font-bold uppercase -mt-1">
                Cinemas & IMAX
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/') ? 'text-violet-700 bg-violet-50' : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50/60'
              }`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/movies') ? 'text-violet-700 bg-violet-50' : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50/60'
              }`}
            >
              Movies
            </Link>

            {isAuthenticated && !isAdmin && (
              <Link
                to="/my-bookings"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/my-bookings')
                    ? 'text-violet-700 bg-violet-50'
                    : 'text-slate-600 hover:text-violet-700 hover:bg-violet-50/60'
                }`}
              >
                <Ticket className="w-4 h-4 text-violet-600" />
                <span>My Tickets</span>
              </Link>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin/post-movie"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === '/admin/post-movie'
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                      : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
                  }`}
                  title="Post a new movie to theater catalog"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Movie</span>
                </Link>

                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                  title="View Admin Portal and Total Collections"
                >
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Total Collection</span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-lg font-mono font-bold">
                    {totalRevenue !== null ? `₹${totalRevenue.toLocaleString('en-IN')}` : '...'}
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700 font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
                    <span className="text-[10px] uppercase font-bold text-violet-600 flex items-center gap-1">
                      {isAdmin ? <ShieldAlert className="w-3 h-3 text-amber-500" /> : null}
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/25 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-violet-700 hover:bg-violet-50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-violet-100 bg-white px-4 pt-2 pb-5 space-y-2 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50"
          >
            Home
          </Link>
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50"
          >
            All Movies
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50"
            >
              <Ticket className="w-5 h-5 text-violet-600" />
              <span>My Tickets</span>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin/post-movie"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-base font-bold text-violet-800 bg-violet-50 border border-violet-200"
              >
                <Plus className="w-5 h-5 text-violet-600" />
                <span>Post New Movie</span>
              </Link>

              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200"
              >
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                  <span>Total Collection</span>
                </span>
                <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-mono font-bold">
                  {totalRevenue !== null ? `₹${totalRevenue.toLocaleString('en-IN')}` : '...'}
                </span>
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 shadow-md shadow-violet-600/20"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
