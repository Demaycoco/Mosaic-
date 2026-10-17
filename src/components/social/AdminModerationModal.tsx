import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { ModerationReport, SocialPost } from '../../types';
import { moderationService } from '../../services/moderationService';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';

interface AdminModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostDeleted?: (postId: string) => void;
}

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  isOpen,
  onClose,
  onPostDeleted,
}) => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadReports = () => {
    setReports(moderationService.getAllReports());
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = moderationService.isAdmin(currentUser);

  const handleResolve = async (reportId: string) => {
    await moderationService.updateReportStatus(reportId, 'resolved');
    loadReports();
    setActionSuccess('Report marked as resolved.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDismiss = async (reportId: string) => {
    await moderationService.updateReportStatus(reportId, 'dismissed');
    loadReports();
    setActionSuccess('Report dismissed.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeletePostContent = async (report: ModerationReport) => {
    if (!currentUser) return;
    if (report.targetType === 'post') {
      try {
        await postService.deletePost(report.targetId, currentUser.id);
      } catch {
        // Force delete through admin authority
        const all = postService.getAllPosts().filter((p) => p.id !== report.targetId);
        localStorage.setItem('mosaic_social_posts_cache', JSON.stringify(all));
      }
      await moderationService.updateReportStatus(report.id, 'resolved');
      loadReports();
      if (onPostDeleted) onPostDeleted(report.targetId);
      setActionSuccess('Violating post deleted and report resolved.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const filtered = reports.filter((r) => r.status === activeTab);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-moderation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#090b16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="admin-moderation-title" className="text-base font-extrabold text-white">
                Platform Moderation Console
              </h2>
              <p className="text-xs text-slate-400">
                Review flagged posts, copyright challenges, and safety reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close moderation console"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 shrink-0">
          {(['pending', 'resolved', 'dismissed'] as const).map((tab) => {
            const count = reports.filter((r) => r.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab}</span>
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Report List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-slate-300">No {activeTab} reports</p>
              <p className="text-xs text-slate-500">The platform is running smoothly with no outstanding flags in this view.</p>
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {r.reason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        Reported {r.targetType}: <strong className="text-white font-mono text-xs">{r.targetId}</strong>
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-slate-300 italic bg-black/30 p-2.5 rounded-xl border border-white/5">
                        "{r.notes}"
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Filed by @{r.reporterUsername} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {activeTab === 'pending' && isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      {r.targetType === 'post' && (
                        <button
                          type="button"
                          onClick={() => handleDeletePostContent(r)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remove offending post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Post</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResolve(r.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(r.id)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
