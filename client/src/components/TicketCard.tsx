import React, { useRef, useState } from 'react';
import { Booking } from '../types/index.js';
import { Calendar, Clock, MapPin, QrCode, CheckCircle2, Printer, Download, Star, Loader2 } from 'lucide-react';
import { printSingleTicket, downloadTicketImage } from '../utils/ticketPrint.js';

interface TicketCardProps {
  booking: Booking;
  onRateClick?: (movieId: string, movieTitle: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ booking, onRateClick }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const safeMovieTitle = booking.movieTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const ticketBaseName = `Ticket_${booking.bookingId}_${safeMovieTitle}`;

  const handlePrint = () => {
    if (!cardRef.current) return;
    printSingleTicket(cardRef.current, ticketBaseName);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      await downloadTicketImage(cardRef.current, `${ticketBaseName}.png`);
    } catch (err) {
      console.error('Failed to download ticket as image:', err);
      // Fallback to print if canvas fails
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  const movieId = typeof booking.movie === 'object' && booking.movie ? booking.movie._id : (booking.movie as string);

  return (
    <div
      ref={cardRef}
      className="ticket-card relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-violet-500/5 flex flex-col md:flex-row group hover:border-violet-300 transition-all duration-300"
    >
      {/* Left/Main Ticket Info */}
      <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between">
        <div>
          {/* Top Header */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Confirmed Ticket
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              #{booking.bookingId}
            </span>
          </div>

          {/* Movie Title & Screen */}
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            {booking.movieTitle}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold mb-6">
            <MapPin className="w-3.5 h-3.5" />
            <span>{booking.screen}</span>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-slate-100">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Date
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.showDate}</span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Showtime
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{booking.showTime}</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Reserved Seats
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {booking.seats.map((seat) => (
                  <span
                    key={seat}
                    className="bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold px-2 py-0.5 rounded-lg"
                  >
                    {seat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Passholder: <strong className="text-slate-800">{booking.userName}</strong>
          </div>

          <div className="flex items-center gap-2 no-print">
            {onRateClick && movieId && (
              <button
                type="button"
                onClick={() => onRateClick(movieId, booking.movieTitle)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Rate Film</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              title="Download ticket image"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Saving...' : 'Download'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              title="Print ticket or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Perforated Tear Divider (Desktop vertical / Mobile horizontal) */}
      <div className="relative flex md:flex-col items-center justify-between">
        <div className="hidden md:block w-5 h-5 rounded-full bg-[#f8f9fd] -mt-2.5 border-b border-slate-200" />
        <div className="flex-1 border-t-2 md:border-t-0 md:border-l-2 border-dashed border-slate-200 w-full md:w-auto h-auto md:h-full my-2 md:my-0" />
        <div className="hidden md:block w-5 h-5 rounded-full bg-[#f8f9fd] -mb-2.5 border-t border-slate-200" />
      </div>

      {/* Right/Stub Section */}
      <div className="w-full md:w-56 bg-violet-50/30 p-6 flex flex-col items-center justify-between text-center border-t md:border-t-0 md:border-l border-slate-200">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total Paid
          </span>
          <div className="text-2xl font-black text-violet-700 font-mono">
            ₹{booking.totalAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 block">{booking.paymentMethod}</span>
        </div>

        {/* QR Code Graphic Simulation */}
        <div className="my-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
          <QrCode className="w-24 h-24 text-slate-900" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Admit {booking.seats.length} Guest{booking.seats.length > 1 ? 's' : ''}</span>
          </div>
          <p className="text-[9px] text-slate-400">Scan at entrance gate</p>
        </div>
      </div>
    </div>
  );
};
