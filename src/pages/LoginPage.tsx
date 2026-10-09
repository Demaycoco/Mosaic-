import React, { useState } from 'react';
import { MosaicLogo } from '../components/brand/MosaicLogo';
import { GoogleAuthButton } from '../components/common/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'signin' | 'signup';
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'signin',
  onNavigate,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setAuthStatus('loading');
    try {
      const { user: _authedUser } = await signInWithGoogle();
      setAuthStatus('success');
      setTimeout(() => {
        // Takes user straight to their account and the main page
        onNavigate('/home');
      }, 300);
    } catch (err: any) {
      setAuthStatus('error');
      setLocalError(err.message || 'Authentication failed. Please retry.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center px-4 relative overflow-hidden bg-[#06070a]">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Back to Home link */}
      <button
        onClick={() => onNavigate('/')}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Mosaic</span>
      </button>

      {/* Auth Container Card */}
      <div className="relative w-full max-w-md bg-[#090b16] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/50 backdrop-blur-xl z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2 cursor-pointer" onClick={() => onNavigate('/')}>
            <MosaicLogo size="lg" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'signup' ? 'Create your Mosaic account' : 'Welcome back to Mosaic'}
          </h1>

          <p className="text-sm text-slate-400">
            {mode === 'signup'
              ? 'Join a social NFT community connecting digital creators with real people.'
              : 'Sign in to access your curated collections, provenance history, and relays.'}
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-purple-600/30 text-white shadow-sm border border-purple-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-purple-600/30 text-white shadow-sm border border-purple-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error notification banner */}
        {localError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{localError}</span>
          </div>
        )}

        {/* Google Authentication Action */}
        <div className="space-y-4">
          <GoogleAuthButton
            variant="primary"
            label={mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
            status={authStatus}
            showArrow={authStatus === 'idle'}
            onClick={handleGoogleSignIn}
            className="w-full justify-center text-sm py-4 shadow-lg shadow-white/5"
          />

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero seed phrases required · Secure Google Identity</span>
          </div>
        </div>

        {/* Features preview */}
        <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Participate in collaborative NFT Relays</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Build your creator or project identity on Mosaic</span>
          </div>
        </div>

        {/* Mode toggle footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-white font-semibold underline underline-offset-2 hover:text-purple-300 ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              New to Mosaic?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-white font-semibold underline underline-offset-2 hover:text-purple-300 ml-1 cursor-pointer"
              >
                Create account
              </button>
            </span>
          )}

          <div className="pt-3">
            <button
              type="button"
              onClick={() => onNavigate('/explore')}
              className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Or explore trending posts, NFTs & creators as guest</span>
              <span className="text-cyan-400">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
