import React, { useState } from 'react';
import { MosaicLogo } from '../components/brand/MosaicLogo';
import { GoogleAuthButton } from '../components/common/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ShieldCheck, AlertCircle, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'signin' | 'signup';
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'signin',
  onNavigate,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const { signInWithGoogle, signInWithGoogleRedirect, signInWithEmail, signUpWithEmail } = useAuth();

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setErrorCode(null);
    setAuthStatus('loading');
    try {
      await signInWithGoogle();
      setAuthStatus('success');
      setTimeout(() => {
        onNavigate('/home');
      }, 350);
    } catch (err: any) {
      setAuthStatus('error');
      setLocalError(err.message || 'Authentication failed. Please retry.');
      setErrorCode(err.code || null);
    }
  };

  const handleGoogleRedirect = async () => {
    setLocalError(null);
    setErrorCode(null);
    setAuthStatus('loading');
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setAuthStatus('error');
      setLocalError(err.message || 'Redirect sign-in failed.');
      setErrorCode(err.code || null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    setLocalError(null);
    setErrorCode(null);
    setIsSubmittingEmail(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      setAuthStatus('success');
      setTimeout(() => {
        onNavigate('/home');
      }, 350);
    } catch (err: any) {
      setLocalError(err.message || 'Email authentication failed.');
      setErrorCode(err.code || null);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

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
      <div className="relative w-full max-w-md bg-[#090b16] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-purple-950/50 backdrop-blur-xl z-10 space-y-7">
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
              setErrorCode(null);
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
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
              setErrorCode(null);
              setAuthStatus('idle');
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
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed font-medium">{localError}</span>
            </div>

            {/* If popup blocked, offer redirect option */}
            {errorCode === 'auth/popup-blocked' && (
              <div className="pt-2 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Use Google Redirect flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If unauthorized domain, show clear setup instructions */}
            {errorCode === 'auth/unauthorized-domain' && currentHostname && (
              <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-300/90 leading-normal space-y-1">
                <p className="font-semibold text-white">How to authorize this domain in Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-rose-200/80">
                  <li>Open Firebase Console &gt; Authentication</li>
                  <li>Go to <strong>Settings</strong> &gt; <strong>Authorized domains</strong></li>
                  <li>Click <strong>Add domain</strong> and enter: <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">{currentHostname}</code></li>
                </ol>
              </div>
            )}

            {/* If Google provider is not yet enabled in Firebase Console */}
            {errorCode === 'auth/operation-not-allowed' && (
              <div className="pt-2 border-t border-rose-500/20 text-[11px] text-rose-300/90 leading-normal space-y-1">
                <p className="font-semibold text-white">Enable Google in Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-rose-200/80">
                  <li>Go to <strong>Firebase Console</strong> &gt; project <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">axiomatic-portal-n1ttq</code></li>
                  <li>Click <strong>Authentication</strong> &gt; <strong>Sign-in method</strong></li>
                  <li>Click <strong>Google</strong>, toggle <strong>Enable</strong>, and click <strong>Save</strong></li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Google Authentication Action */}
        <div className="space-y-3">
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

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <button
            type="button"
            onClick={() => setAuthMethod(authMethod === 'google' ? 'email' : 'google')}
            className="bg-[#090b16] px-3 text-[11px] uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {authMethod === 'google' ? 'or continue with email' : 'hide email option'}
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
                    placeholder="Your creator name"
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
                ? 'Create Account with Email'
                : 'Sign In with Email'}
            </button>
          </form>
        )}

        {/* Features preview */}
        <div className="pt-2 border-t border-white/5 space-y-2 text-xs text-slate-400">
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
                onClick={() => {
                  setMode('signin');
                  setLocalError(null);
                  setErrorCode(null);
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
                  setLocalError(null);
                  setErrorCode(null);
                }}
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
