import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { KeyRound, X, Copy, Check, AlertTriangle } from 'lucide-react';

export const DevOtpBanner: React.FC = () => {
  const { devOtpNotice, setDevOtpNotice } = useAuth();
  const [copied, setCopied] = React.useState(false);

  // If no devOtp was returned by the server (i.e. real email delivered or no active OTP), don't render anything
  if (!devOtpNotice) return null;

  const isDev = import.meta.env.DEV;

  const handleCopy = () => {
    navigator.clipboard.writeText(devOtpNotice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white/95 backdrop-blur-md border border-violet-200 p-4 rounded-2xl shadow-2xl shadow-violet-500/15 animate-bounce-once">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
          {isDev ? (
            <KeyRound className="w-4 h-4 text-violet-600 animate-pulse" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          )}
          <span>{isDev ? 'Dev Mode OTP Helper' : 'Cloud Fallback OTP Helper'}</span>
        </div>
        <button
          onClick={() => setDevOtpNotice(null)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {isDev
          ? 'Your verification code (also logged in server terminal):'
          : 'Render blocked SMTP ports. Your verification code (also in Render logs):'}
      </p>
      <div className="mt-2.5 flex items-center justify-between bg-violet-50/70 px-3 py-2 rounded-xl border border-violet-100">
        <span className="font-mono text-xl font-bold tracking-widest text-violet-700">
          {devOtpNotice}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      {!isDev && (
        <p className="text-[10px] text-amber-600 mt-2 bg-amber-50 p-1.5 rounded border border-amber-200">
          💡 Add <code className="font-mono font-bold">RESEND_API_KEY</code> to Render Environment Variables to enable direct inbox delivery over HTTPS.
        </p>
      )}
    </div>
  );
};
