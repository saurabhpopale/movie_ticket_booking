import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  Loader2,
  QrCode,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number; // in Rupees
  movieTitle: string;
  seats: string[];
  userEmail: string;
  userName: string;
  onPaymentSuccess: (paymentData: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    method: string;
  }) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  movieTitle,
  seats,
  userEmail,
  userName,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState(`${userName.toLowerCase().replace(/\s+/g, '') || 'customer'}@okhdfcbank`);
  const [showQr, setShowQr] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('782');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('PhonePe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setProcessingStep('Connecting to Razorpay Indian Banking Gateway...');

    setTimeout(() => {
      setProcessingStep('Verifying 2-Factor Authentication...');
    }, 900);

    setTimeout(() => {
      setProcessingStep('Authorized by Bank! Finalizing ticket issuance...');
    }, 1800);

    setTimeout(() => {
      const generatedPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const generatedSignature = `simulated_sig_${orderId}`;

      let methodLabel = 'Razorpay UPI';
      if (activeTab === 'card') methodLabel = 'Razorpay Card (RuPay/Visa)';
      else if (activeTab === 'netbanking') methodLabel = `Razorpay NetBanking (${selectedBank})`;
      else if (activeTab === 'wallet') methodLabel = `Razorpay Wallet (${selectedWallet})`;

      setIsProcessing(false);
      onPaymentSuccess({
        razorpayOrderId: orderId,
        razorpayPaymentId: generatedPaymentId,
        razorpaySignature: generatedSignature,
        method: methodLabel,
      });
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col relative transition-all">
        {/* Razorpay Signature Brand Header */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#3395ff] text-white flex items-center justify-center font-black text-sm">
                R
              </div>
              <span className="font-extrabold text-base tracking-tight">Razorpay</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Trusted Business
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Payable
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                ₹{amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-semibold text-white">{movieTitle}</p>
              <p className="text-[11px] text-slate-400">Seats: {seats.join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-400">{orderId}</p>
              <p className="text-[11px] text-slate-300">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Processing Razorpay Transaction
              </h3>
              <p className="text-xs text-slate-600 font-medium animate-pulse">
                {processingStep}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-2">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit Bank Grade Security</span>
            </div>
          </div>
        )}

        {/* Payment Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'upi'
                ? 'border-[#3395ff] text-[#0c2340] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'card'
                ? 'border-[#3395ff] text-[#0c2340] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-violet-600" />
            <span>Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('netbanking')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'netbanking'
                ? 'border-[#3395ff] text-[#0c2340] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>NetBanking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'wallet'
                ? 'border-[#3395ff] text-[#0c2340] bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-600" />
            <span>Wallets</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 flex-1 min-h-[260px]">
          {/* TAB 1: UPI */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              {/* UPI Quick Apps Pills */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                  <div
                    key={app}
                    onClick={() => setShowQr(false)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 cursor-pointer transition-all text-center"
                  >
                    <span className="block text-[11px] font-bold text-slate-800">{app}</span>
                    <span className="text-[9px] text-emerald-600 font-semibold">Instant Pay</span>
                  </div>
                ))}
              </div>

              {/* QR Code or UPI ID Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700">UPI Identification</span>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="text-xs text-[#3395ff] font-bold hover:underline flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Use UPI ID' : 'Show UPI QR Code'}</span>
                </button>
              </div>

              {showQr ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or username@okhdfcbank"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3395ff] focus:bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    A collect request of ₹{amount.toFixed(2)} will be dispatched to your UPI app.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREDIT / DEBIT CARDS */}
          {activeTab === 'card' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Supported Cards</span>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-700">RuPay</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-blue-700">VISA</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-amber-700">MasterCard</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#3395ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3395ff]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#3395ff]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETBANKING */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Popular Indian Banks
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                      selectedBank === bank
                        ? 'border-[#3395ff] bg-blue-50/50 text-[#0c2340]'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{bank}</span>
                    {selectedBank === bank && <CheckCircle2 className="w-3.5 h-3.5 text-[#3395ff]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WALLETS */}
          {activeTab === 'wallet' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Select Digital Wallet
              </span>
              <div className="space-y-2">
                {['PhonePe Wallet', 'Paytm Wallet', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
                  <button
                    key={wallet}
                    type="button"
                    onClick={() => setSelectedWallet(wallet)}
                    className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                      selectedWallet === wallet
                        ? 'border-[#3395ff] bg-blue-50/50 text-[#0c2340]'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{wallet}</span>
                    {selectedWallet === wallet && <CheckCircle2 className="w-3.5 h-3.5 text-[#3395ff]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-[#3395ff] hover:bg-[#2080ea] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>Pay ₹{amount.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured by <strong>Razorpay Payment Gateway</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
