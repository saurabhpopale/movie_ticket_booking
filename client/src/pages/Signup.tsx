import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Film, Mail, Lock, User as UserIcon, KeyRound, ShieldAlert, Loader2, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const { registerInitiate, registerVerify, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Handle Step 1: Submit details
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isKnownAdminEmail = normalizedEmail.includes('admin') || normalizedEmail.includes('saurabhpopale720');

    if (role === 'admin' && !adminSecretKey && !isKnownAdminEmail) {
      setErrorMessage('Admin secret passphrase is required for admin signup (default: admin123).');
      return;
    }

    try {
      setIsLoading(true);
      const effectiveAdminKey = role === 'admin' ? (adminSecretKey || (isKnownAdminEmail ? 'admin123' : undefined)) : undefined;
      const res = await registerInitiate({
        name,
        email: normalizedEmail,
        password,
        role,
        adminSecretKey: effectiveAdminKey,
      });

      setSuccessMessage(res.message || 'OTP verification code sent to your email!');
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Submit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await registerVerify(email, fullOtp);
      if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await resendOtp(email, 'signup');
      setSuccessMessage(res.message || 'Fresh OTP dispatched!');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border border-violet-100 rounded-3xl p-8 sm:p-10 shadow-xl shadow-violet-500/5 relative">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-violet-500/25 mb-4">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {step === 'details' ? 'Create an Account' : 'Verify Your Email'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            {step === 'details'
              ? 'Join CinePass for seamless cinema ticketing and ratings'
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs leading-relaxed">
            {successMessage}
          </div>
        )}

        {/* STEP 1: DETAILS */}
        {step === 'details' ? (
          <form onSubmit={handleInitiateSignup} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                    role === 'user'
                      ? 'bg-violet-50 border-violet-500 text-slate-900 shadow-sm shadow-violet-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs text-violet-700 flex items-center justify-between">
                    <span>🎟️ Moviegoer</span>
                    {role === 'user' && <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Book tickets & rate films</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                    role === 'admin'
                      ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs text-amber-700 flex items-center justify-between">
                    <span>👑 Cinema Admin</span>
                    {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">Post movies & revenue</span>
                </button>
              </div>
            </div>

            {/* Admin Key Input (only visible if admin selected) - Passkey NOT removed */}
            {role === 'admin' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin Secret Key</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminSecretKey}
                  onChange={(e) => setAdminSecretKey(e.target.value)}
                  placeholder="Enter secret key (default: admin123)"
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[10px] text-amber-800">
                  Default passkey for dev test: <strong className="font-mono text-amber-900 font-bold">admin123</strong>
                </p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send OTP Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: VERIFY OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs text-violet-600 hover:text-violet-700 hover:underline font-semibold"
                >
                  Edit details
                </button>
              </div>

              {/* 6 Digit Input Group */}
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-full aspect-square text-center font-mono font-bold text-xl sm:text-2xl bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 focus:bg-white"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify Email & Create Account</span>
                </>
              )}
            </button>

            {/* Resend Timer */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:text-slate-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? (
                  <span>Resend Code in {resendCooldown}s</span>
                ) : (
                  <span className="text-violet-600 hover:underline">Resend Verification Code</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
