import React from 'react';
import { Film, ShieldCheck, Sparkles, Popcorn, Ticket } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">CinePass</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Next-generation cinema ticketing experience with seamless seat selection, real-time OTP authentication, and community-driven film ratings.
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Email & OTP Secure Auth</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>IMAX Laser & Dolby Atmos</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Ticket className="w-4 h-4 text-violet-600" />
                <span>Instant Digital e-Tickets</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Popcorn className="w-4 h-4 text-purple-600" />
                <span>Interactive Live Seat Map</span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/movies" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Now Showing
                </a>
              </li>
              <li>
                <a href="/movies" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Upcoming Releases
                </a>
              </li>
              <li>
                <a href="/my-bookings" className="text-slate-600 hover:text-violet-600 transition-colors">
                  My Booked Tickets
                </a>
              </li>
              <li>
                <a href="/admin" className="text-slate-600 hover:text-violet-600 transition-colors">
                  Cinema Admin Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Cinema Technologies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Formats Available</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-700">
                IMAX 3D
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-700">
                DOLBY ATMOS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-700">
                4DX MOTION
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[11px] font-semibold text-violet-700">
                VIP RECLINER
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              All auditoriums equipped with 4K laser projection and spatial surround sound.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CinePass Entertainment, Inc. Built with MERN + TypeScript + Tailwind.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 text-slate-500">
            <span className="hover:text-violet-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-violet-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-violet-600 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
