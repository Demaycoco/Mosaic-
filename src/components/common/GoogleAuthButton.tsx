import React from 'react';
import { ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface GoogleAuthButtonProps {
  variant?: 'primary' | 'secondary' | 'nav' | 'compact';
  label?: string;
  status?: 'idle' | 'loading' | 'success' | 'error';
  showArrow?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  variant = 'primary',
  label = 'Continue with Google',
  status = 'idle',
  showArrow = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  // Official recognizable Google multicolored "G" SVG icon
  const GoogleIcon = () => (
    <svg
      className="w-4.5 h-4.5 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );

  let currentLabel = label;
  if (status === 'loading') currentLabel = 'Signing in...';
  if (status === 'success') currentLabel = 'Signed in successfully';
  if (status === 'error') currentLabel = 'Authentication failed. Try again';

  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || status === 'loading'}
        className={`inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-xs md:text-sm font-medium text-slate-100 bg-[#0f1322] border border-white/15 hover:border-purple-400/40 hover:bg-[#151b30] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
        ) : (
          <GoogleIcon />
        )}
        <span>{status === 'idle' ? 'Sign up / Sign in' : currentLabel}</span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || status === 'loading'}
        className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
        ) : (
          <GoogleIcon />
        )}
        <span>{currentLabel}</span>
        {showArrow && status === 'idle' && (
          <ArrowRight className="w-4 h-4 ml-0.5 text-slate-300" />
        )}
      </button>
    );
  }

  // Primary white button matching production Google SSO
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || status === 'loading'}
      className={`inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full text-sm font-bold transition-all duration-200 shadow-lg active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        status === 'error'
          ? 'bg-rose-50 text-rose-950 border border-rose-300'
          : status === 'success'
          ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
          : 'text-slate-900 bg-white hover:bg-slate-100 shadow-white/10 hover:shadow-xl hover:shadow-purple-500/10'
      } ${className}`}
    >
      {status === 'loading' ? (
        <Loader2 className="w-4.5 h-4.5 text-purple-600 animate-spin shrink-0" />
      ) : status === 'success' ? (
        <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
      ) : (
        <GoogleIcon />
      )}
      <span>{currentLabel}</span>
      {showArrow && status === 'idle' && (
        <ArrowRight className="w-4 h-4 ml-0.5 text-slate-900" />
      )}
    </button>
  );
};
