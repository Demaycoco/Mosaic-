import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, AlertCircle, Mail, Lock, User, ExternalLink, ArrowRight } from 'lucide-react';
import { GoogleAuthButton } from '../common/GoogleAuthButton';
import { MosaicLogo } from '../brand/MosaicLogo';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onOnboardingRedirect?: () => void;
  onSuccessRedirect?: (route: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccessRedirect,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const { signInWithGoogle, signInWithGoogleRedirect, signInWithEmail, signUpWithEmail, user } = useAuth();

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    setAuthStatus('loading');
    try {
      await signInWithGoogle();
      setAuthStatus('success');
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect) {
          onSuccessRedirect('/home');
        }
      }, 400);
    } catch (err: any) {
      setAuthStatus('error');
      setAuthError(err.message || 'Google sign-in could not be completed.');
      setAuthErrorCode(err.code || null);
    }
  };

  const handleGoogleRedirect = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    setAuthStatus('loading');
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setAuthStatus('error');
      setAuthError(err.message || 'Redirect sign-in failed.');
      setAuthErrorCode(err.code || null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }
    setAuthError(null);
    setAuthErrorCode(null);
    setIsSubmittingEmail(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      setAuthStatus('success');
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect) {
          onSuccessRedirect('/home');
        }
      }, 400);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify your details.');
      setAuthErrorCode(err.code || null);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0a0c16] border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl shadow-purple-950/60 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-purple-500/20 via-blue-500/10 to-transparent blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* User already authenticated state */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Signed In to Mosaic</h3>
            <p className="text-sm text-slate-300">
              Connected as <strong className="text-white">@{user.username}</strong> ({user.email})
            </p>
            <p className="text-xs text-slate-400">
              Your session is active across the Mosaic platform.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (onSuccessRedirect) onSuccessRedirect('/home');
                }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-lg shadow-purple-950/50"
              >
                Go to Account
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <MosaicLogo size="lg" />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {mode === 'signup' ? 'Join Mosaic' : 'Welcome back'}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                {mode === 'signup'
                  ? 'Connect with creators and shape collaborative NFT stories with real people.'
                  : 'Sign in to access your profile, bookmarked Relays, and collection.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setAuthError(null);
                  setAuthErrorCode(null);
                  setAuthStatus('idle');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-purple-600/30 text-white shadow-sm border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setAuthError(null);
                  setAuthErrorCode(null);
                  setAuthStatus('idle');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-purple-600/30 text-white shadow-sm border border-purple-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Error banner with actionable details */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed font-medium">{authError}</span>
                </div>

                {/* If popup was blocked, show redirect button */}
                {authErrorCode === 'auth/popup-blocked' && (
                  <div className="pt-2 border-t border-rose-500/20">
                    <button
                      type="button"
                      onClick={handleGoogleRedirect}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Try Google Redirect Flow instead</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* If unauthorized domain, display clear helper */}
                {authErrorCode === 'auth/unauthorized-domain' && currentHostname && (
                  <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-300/90 leading-normal space-y-1">
                    <p className="font-semibold text-white">How to fix in Firebase Console:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-rose-200/80">
                      <li>Open Firebase Console &gt; Authentication</li>
                      <li>Go to <strong>Settings</strong> &gt; <strong>Authorized domains</strong></li>
                      <li>Click <strong>Add domain</strong> and paste: <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{currentHostname}</code></li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Primary Google Auth Action */}
            <div className="space-y-3">
              <GoogleAuthButton
                variant="primary"
                label={mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
                status={authStatus}
                showArrow={authStatus === 'idle'}
                onClick={handleGoogleAuth}
                className="w-full justify-center text-sm py-3.5 shadow-md"
              />

              <div className="flex items-center gap-2 justify-center text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero seed phrases required · Verified Google Identity</span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <button
                type="button"
                onClick={() => setAuthMethod(authMethod === 'google' ? 'email' : 'google')}
                className="bg-[#0a0c16] px-3 text-[11px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {authMethod === 'google' ? 'or use email / password' : 'hide email option'}
              </button>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Optional Email & Password Form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3 animate-in fade-in duration-200">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name or alias"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEmail}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmittingEmail
                    ? 'Processing...'
                    : mode === 'signup'
                    ? 'Create account with Email'
                    : 'Sign in with Email'}
                </button>
              </form>
            )}

            {/* Platform Values Highlight */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Collaborate on narrative Relays, project hubs, and community drops.</span>
              </div>
            </div>

            {/* Toggle footer */}
            <div className="text-center text-xs text-slate-400 pt-1">
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setAuthError(null);
                      setAuthErrorCode(null);
                    }}
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
                    onClick={() => {
                      setMode('signup');
                      setAuthError(null);
                      setAuthErrorCode(null);
                    }}
                    className="text-white font-semibold underline underline-offset-2 hover:text-purple-300 ml-1 cursor-pointer"
                  >
                    Create account
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
