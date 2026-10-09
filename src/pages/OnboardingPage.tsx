import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { MosaicLogo } from '../components/brand/MosaicLogo';
import { sanitizeUsername } from '../services/authService';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { currentUser, updateUser, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setDisplayName(currentUser.displayName || '');
      setBio(currentUser.bio || '');
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a]">
        <div className="flex flex-col items-center gap-3">
          <MosaicLogo size="md" />
          <p className="text-sm text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a] p-4">
        <div className="p-8 rounded-2xl bg-[#090b16] border border-white/10 text-center max-w-sm space-y-4">
          <p className="text-slate-300 text-sm">Please sign in with Google to continue onboarding.</p>
          <button
            onClick={onComplete}
            className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-xs cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (skipOptional = false) => {
    setError(null);
    const cleaned = sanitizeUsername(username || currentUser.username);
    if (!cleaned || cleaned.length < 3) {
      setError('Username is required and must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser({
        username: cleaned,
        displayName: displayName.trim() || currentUser.displayName || 'Mosaic Creator',
        bio: skipOptional ? '' : bio.trim(),
        profileCompleted: true,
      });

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-[#06070a] flex items-center justify-center relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#090b16] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-purple-950/60 z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <MosaicLogo size="md" />
          </div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
            FIRST LOGIN ONBOARDING
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Set up your Mosaic profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Choose your handle and identity. No wallet address or private keys needed.
          </p>
        </div>

        {/* User Google Account Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/5">
          <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{currentUser.displayName}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
            <span className="inline-block text-[10px] text-emerald-400 font-medium">
              ● Google Account Connected
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Only 3 clean fields: Username (required), Display Name, Bio (optional) */}
        <div className="space-y-5">
          {/* Username (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Username <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Unique handle</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name or Alias"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Bio (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Bio <span className="text-slate-500 text-[10px] normal-case font-normal">(optional)</span>
              </label>
              <span className="text-[10px] text-slate-500">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              maxLength={160}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you collect or create..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Skip optional fields
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-lg shadow-purple-900/40 cursor-pointer"
          >
            <span>{isSubmitting ? 'Creating profile...' : 'Complete Profile'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
