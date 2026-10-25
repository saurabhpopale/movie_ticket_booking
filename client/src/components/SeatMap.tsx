import React from 'react';
import { Check, X } from 'lucide-react';

interface SeatMapProps {
  bookedSeats: string[];
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  basePrice: number;
}

interface RowConfig {
  row: string;
  tier: 'VIP' | 'Executive' | 'Standard';
  surcharge: number;
}

const ROWS_CONFIG: RowConfig[] = [
  { row: 'A', tier: 'VIP', surcharge: 100 },
  { row: 'B', tier: 'VIP', surcharge: 100 },
  { row: 'C', tier: 'Executive', surcharge: 50 },
  { row: 'D', tier: 'Executive', surcharge: 50 },
  { row: 'E', tier: 'Standard', surcharge: 0 },
  { row: 'F', tier: 'Standard', surcharge: 0 },
];

export const SeatMap: React.FC<SeatMapProps> = ({
  bookedSeats,
  selectedSeats,
  onToggleSeat,
  basePrice,
}) => {
  const isBooked = (seatId: string) => bookedSeats.includes(seatId);
  const isSelected = (seatId: string) => selectedSeats.includes(seatId);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Screen Curved Header */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <div className="w-full h-2.5 bg-gradient-to-r from-transparent via-violet-600 to-transparent rounded-full shadow-[0_0_25px_rgba(124,58,237,0.6)]" />
        <div className="w-4/5 h-8 bg-gradient-to-b from-violet-500/15 to-transparent blur-sm -mt-1 rounded-t-full pointer-events-none" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-400 mt-2">
          SCREEN THIS WAY
        </span>
      </div>

      {/* Seat Rows Grid */}
      <div className="space-y-3.5 w-full max-w-2xl overflow-x-auto pb-4">
        {ROWS_CONFIG.map(({ row, tier, surcharge }) => {
          const seatPrice = basePrice + surcharge;

          return (
            <div key={row} className="flex items-center justify-center gap-2 sm:gap-4 min-w-[500px]">
              {/* Row Label & Tier Indicator */}
              <div className="w-12 text-right">
                <span className="text-xs font-bold text-slate-700">{row}</span>
                <span className="block text-[9px] text-slate-400 uppercase font-semibold">{tier}</span>
              </div>

              {/* Left Aisle (Seats 1-5) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const seatId = `${row}${num}`;
                  const booked = isBooked(seatId);
                  const selected = isSelected(seatId);

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={booked}
                      onClick={() => onToggleSeat(seatId)}
                      title={`${seatId} - ₹${seatPrice} (${tier}) ${booked ? '[BOOKED]' : ''}`}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-150 ${
                        booked
                          ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                          : selected
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40 ring-2 ring-violet-400 scale-105'
                          : tier === 'VIP'
                          ? 'bg-amber-50 hover:bg-violet-50 text-amber-800 border border-amber-300 hover:border-violet-400'
                          : 'bg-white hover:bg-violet-50 text-slate-700 border border-slate-200 hover:border-violet-400 shadow-sm'
                      }`}
                    >
                      {booked ? (
                        <X className="w-3.5 h-3.5 text-slate-300" />
                      ) : selected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-[11px]">{num}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center Aisle Gap */}
              <div className="w-4 sm:w-8 text-center">
                <span className="text-[10px] text-slate-300 font-mono">•</span>
              </div>

              {/* Right Aisle (Seats 6-10) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {[6, 7, 8, 9, 10].map((num) => {
                  const seatId = `${row}${num}`;
                  const booked = isBooked(seatId);
                  const selected = isSelected(seatId);

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={booked}
                      onClick={() => onToggleSeat(seatId)}
                      title={`${seatId} - ₹${seatPrice} (${tier}) ${booked ? '[BOOKED]' : ''}`}
                      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-150 ${
                        booked
                          ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                          : selected
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40 ring-2 ring-violet-400 scale-105'
                          : tier === 'VIP'
                          ? 'bg-amber-50 hover:bg-violet-50 text-amber-800 border border-amber-300 hover:border-violet-400'
                          : 'bg-white hover:bg-violet-50 text-slate-700 border border-slate-200 hover:border-violet-400 shadow-sm'
                      }`}
                    >
                      {booked ? (
                        <X className="w-3.5 h-3.5 text-slate-300" />
                      ) : selected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-[11px]">{num}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <div className="w-8 text-left">
                <span className="text-xs font-bold text-slate-400">{row}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Map Legend */}
      <div className="mt-8 pt-4 border-t border-slate-200 w-full max-w-xl flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-white border border-slate-200 shadow-sm" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-violet-600 ring-2 ring-violet-400 flex items-center justify-center text-white">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
            <X className="w-3 h-3" />
          </div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-[10px]">
            VIP
          </div>
          <span>VIP (+₹100)</span>
        </div>
      </div>
    </div>
  );
};
