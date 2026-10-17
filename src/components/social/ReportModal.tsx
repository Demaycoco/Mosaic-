import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ModerationReport } from '../../types';
import { moderationService } from '../../services/moderationService';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'profile';
  targetId: string;
  targetAuthorName?: string;
  targetAuthorUsername?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS: Array<{ id: ModerationReport['reason']; label: string; desc: string }> = [
  { id: 'spam', label: 'Spam or malicious links', desc: 'Promotional mass spam, phishing, scams, or false token drops' },
  { id: 'harassment', label: 'Harassment or intimidation', desc: 'Targeted hostility, threats, or abusive conduct' },
  { id: 'hate_speech', label: 'Hate speech or discrimination', desc: 'Attacks based on protected identity, ethnicity, or beliefs' },
  { id: 'copyright', label: 'Copyright or stolen NFT art', desc: 'Uncredited artwork, stolen intellectual property, or copy-mint' },
  { id: 'misinformation', label: 'Deceptive or fraudulent info', desc: 'Impersonation, fabricated contract addresses, or false announcements' },
  { id: 'other', label: 'Other platform violation', desc: 'Any other violation of Mosaic community standards' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthorName,
  targetAuthorUsername,
  onReportSubmitted,
}) => {
  const { currentUser } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ModerationReport['reason']>('spam');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      await moderationService.reportContent({
        targetType,
        targetId,
        targetAuthorId: targetAuthorUsername,
        reason: selectedReason,
        notes: notes.trim(),
        reporterId: currentUser.id,
        reporterUsername: currentUser.username,
      });

      setSubmitted(true);
      if (onReportSubmitted) onReportSubmitted();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#090b16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-base font-extrabold text-white">
                Report {targetType === 'post' ? 'Post' : 'Profile'}
              </h2>
              <p className="text-xs text-slate-400">
                Help keep Mosaic a safe, authentic creative network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report dialog"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for keeping our community safe. Our moderation team has logged this incident and will review it promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {targetAuthorUsername && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300">
                Reporting {targetType}: <span className="font-semibold text-white">{targetAuthorName || `@${targetAuthorUsername}`}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Reason
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedReason === r.id
                        ? 'bg-rose-950/30 border-rose-500/50 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 text-rose-500 focus:ring-rose-500"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold">{r.label}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-notes" className="text-xs font-semibold text-slate-300">
                Additional Context (Optional)
              </label>
              <textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide relevant details or links to aid investigation..."
                rows={3}
                maxLength={400}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-950/50"
              >
                {isSubmitting ? 'Filing Report...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
