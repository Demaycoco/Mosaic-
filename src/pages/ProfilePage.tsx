import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Avatar } from '../components/common/Avatar';
import { sanitizeUsername } from '../services/authService';
import { postService } from '../services/postService';
import { projectService } from '../services/projectService';
import { nftOwnershipService } from '../services/nftOwnershipService';
import { SocialPost, NftProjectAccount, OwnedNft } from '../types';
import { PostCard } from '../components/social/PostCard';
import { OwnedNftCard } from '../components/nft/OwnedNftCard';
import { OwnedNftDetailModal } from '../components/nft/OwnedNftDetailModal';
import { WalletModal } from '../components/wallet/WalletModal';
import { CreateRelayModal } from '../components/relay/CreateRelayModal';
import { formatAddress } from '../constants/chains';
import { EditProfileModal } from '../components/social/EditProfileModal';
import { UserBioExtras } from '../components/social/UserBioExtras';
import { walletAuthService } from '../services/walletAuthService';
import {
  ArrowLeft,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Settings,
  LogOut,
  MessageSquare,
  Bookmark,
  Layers,
  Camera,
  Wallet,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  onNavigateSettings?: () => void;
  onNavigateLogin?: () => void;
  onSignOut?: () => void;
  onNavigateLanding?: () => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onNavigateSettings,
  onNavigateLogin,
  onSignOut,
  onNavigateLanding,
  onSelectPost,
  onSelectUser,
  onSelectHashtag,
}) => {
  const { currentUser, updateUser, signOut, loading } = useAuth();
  const {
    walletState,
    chainConfig,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    signVerificationMessage,
  } = useWallet();

  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Tabs: 'nfts' is a primary tab alongside 'posts', 'bookmarks', 'projects'
  const [activeTab, setActiveTab] = useState<'posts' | 'nfts' | 'bookmarks' | 'projects'>('nfts');

  // Social data
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<SocialPost[]>([]);
  const [userProjects, setUserProjects] = useState<NftProjectAccount[]>([]);

  // NFT Ownership states
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [nftError, setNftError] = useState<string | null>(null);
  const [selectedChainFilter, setSelectedChainFilter] = useState<number | undefined>(undefined);
  const [nftSearchQuery, setNftSearchQuery] = useState('');
  const [selectedDetailNft, setSelectedDetailNft] = useState<OwnedNft | null>(null);

  // Wallet Modal & Verification
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [isVerifyingSignature, setIsVerifyingSignature] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [createRelayTarget, setCreateRelayTarget] = useState<OwnedNft | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserPosts(postService.getUserPosts(currentUser.username));
      setBookmarkedPosts(postService.getBookmarkedPosts(currentUser.id));
      setUserProjects(
        projectService.getAllProjects().filter((p) => p.ownerId === currentUser.id)
      );
    }
  }, [currentUser]);

  // Load genuine on-chain owned NFTs when wallet is connected
  const fetchOwnedNfts = useCallback(
    async (force = false) => {
      if (!walletState.address) {
        setOwnedNfts([]);
        return;
      }

      setIsLoadingNfts(true);
      setNftError(null);

      try {
        const nfts = await nftOwnershipService.getOwnedNfts(
          walletState.address,
          selectedChainFilter,
          force
        );
        setOwnedNfts(nfts);
      } catch (err: any) {
        console.error('Error fetching owned NFTs:', err);
        setNftError('Failed to retrieve on-chain NFTs. Please verify your network connection.');
      } finally {
        setIsLoadingNfts(false);
      }
    },
    [walletState.address, selectedChainFilter]
  );

  useEffect(() => {
    if (walletState.address) {
      fetchOwnedNfts();
    } else {
      setOwnedNfts([]);
    }
  }, [walletState.address, selectedChainFilter, fetchOwnedNfts]);

  // Explicit user-driven challenge-response wallet ownership verification
  const handleVerifyWalletOwnership = async () => {
    if (!walletState.address || !currentUser) return;
    setIsVerifyingSignature(true);
    setVerificationFeedback(null);

    try {
      // 1. Generate challenge with unique nonce, timestamp, and expiration
      const challenge = walletAuthService.createChallenge(
        walletState.address,
        walletState.chainId || 1
      );
      const signMessage = walletAuthService.formatSignMessage(challenge);

      // 2. Request user cryptographic signature via wallet
      const signature = await signVerificationMessage(signMessage);
      if (signature) {
        // 3. Verify signature recovery and enforce replay protection
        const result = walletAuthService.verifySignature(
          walletState.address,
          signMessage,
          signature
        );

        if (result.verified) {
          await updateUser({
            linkedWalletAddress: walletState.address,
            walletVerified: true,
          });
          setVerificationFeedback('Cryptographic proof verified! Wallet linked to your identity.');
          setTimeout(() => setVerificationFeedback(null), 5000);
        } else {
          console.warn('Challenge verification failed:', result.error);
        }
      }
    } catch (e: any) {
      console.warn('Signature verification declined or failed', e);
    } finally {
      setIsVerifyingSignature(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a] p-4">
        <div className="p-8 rounded-3xl bg-[#090b16] border border-white/10 text-center max-w-sm space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Sign In Required</h3>
          <p className="text-slate-400 text-xs">Please sign in with your Google account to view and manage your Mosaic profile.</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onNavigateLogin}
              className="w-full py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Sign In with Google
            </button>
            <button
              onClick={onNavigateLanding || onBack}
              className="w-full py-2.5 rounded-full bg-white/5 text-slate-400 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    if (onSignOut) {
      onSignOut();
    } else if (onNavigateLanding) {
      onNavigateLanding();
    } else {
      onBack();
    }
  };

  const startEditing = () => {
    setEditDisplayName(currentUser.displayName);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditPhotoURL(currentUser.photoURL || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = sanitizeUsername(editUsername);
    if (!cleanUsername || cleanUsername.length < 3) return;

    setIsSaving(true);
    try {
      await updateUser({
        displayName: editDisplayName.trim() || currentUser.displayName,
        username: cleanUsername,
        bio: editBio.trim(),
        photoURL: editPhotoURL.trim() || currentUser.photoURL,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2026';

  // Filter owned NFTs by search
  const filteredOwnedNfts = ownedNfts.filter((nft) => {
    if (!nftSearchQuery) return true;
    const q = nftSearchQuery.toLowerCase();
    return (
      nft.name.toLowerCase().includes(q) ||
      nft.collectionName.toLowerCase().includes(q) ||
      nft.tokenId.toLowerCase().includes(q) ||
      nft.contractAddress.toLowerCase().includes(q)
    );
  });

  const isWalletConnected = walletState.status === 'connected' && !!walletState.address;
  const isProfileWalletLinked =
    isWalletConnected &&
    currentUser.walletVerified &&
    currentUser.linkedWalletAddress?.toLowerCase() === walletState.address?.toLowerCase();

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-[#06070a] relative overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateLanding || onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing Page</span>
          </button>

          <div className="flex items-center gap-3">
            {onNavigateSettings && (
              <button
                type="button"
                onClick={onNavigateSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}

            {/* Prominent Log Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
              title="Log out of account and return to landing page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 1. SOCIAL IDENTITY CARD */}
        <div className="relative rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl overflow-hidden">
          {/* Custom Header Banner */}
          <div className="h-40 sm:h-56 relative overflow-hidden bg-slate-900 border-b border-white/10 group">
            {currentUser.bannerURL ? (
              <img
                src={currentUser.bannerURL}
                alt="Banner"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 flex items-center justify-center">
                <span className="text-xs text-slate-400 font-medium">Click Edit Header to set your banner</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20" />
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer shadow-lg"
              title="Change Header Picture"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Header</span>
            </button>
          </div>

          <div className="p-6 sm:p-10 pt-0 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/10 -mt-12 sm:-mt-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="relative group">
                  <Avatar
                    src={currentUser.photoURL}
                    name={currentUser.displayName}
                    size="xl"
                    className="ring-4 ring-[#090b16] shadow-2xl"
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                    title="Update profile picture"
                  >
                    <Camera className="w-5 h-5 text-cyan-400" />
                  </button>
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#090b16]" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {currentUser.displayName}
                    </h2>
                    <span title="Google Verified Member">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </span>
                  </div>
                  <p className="text-sm text-purple-400 font-semibold font-mono">@{currentUser.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 transition-all cursor-pointer shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* Bio and Expanded Socials & Communities Section */}
            <div className="pt-4 space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed whitespace-pre-line">
                {currentUser.bio || 'Digital creator & collector on the Mosaic Web3 network.'}
              </p>

              {/* Social Media Links (X, Instagram, TikTok) and Mosaic NFT Communities */}
              <UserBioExtras
                xLink={currentUser.xLink}
                instagramLink={currentUser.instagramLink}
                tiktokLink={currentUser.tiktokLink}
                website={currentUser.website}
                nftCommunities={currentUser.nftCommunities}
                isOwnProfile={true}
                onOpenEditCommunities={() => setIsEditing(true)}
                onSelectProject={(projectUsername) => {
                  if (onSelectUser) onSelectUser(projectUsername);
                }}
              />

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-3 border-t border-white/5">
                <span>Joined {formattedDate}</span>
                <span>·</span>
                <span className="text-slate-400">{currentUser.email}</span>
                <span>·</span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-white/5 text-purple-300 font-medium">
                  Google Social Identity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for comprehensive editing */}
        {currentUser && (
          <EditProfileModal
            user={currentUser}
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            onSave={async (updated) => {
              await updateUser(updated);
            }}
          />
        )}

        {/* 2. OPTIONAL WEB3 WALLET LAYER (Conceptually Separate) */}
        <div className="rounded-3xl bg-[#090b16] border border-white/10 shadow-xl p-6 overflow-hidden relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wallet className="w-4.5 h-4.5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Web3 Wallet Layer (Optional)
                </h3>
                {isProfileWalletLinked && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Cryptographically Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                A Google account does not imply wallet ownership. Wallets are only connected when you wish to verify ownership and display genuine on-chain NFTs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isWalletConnected ? (
                <>
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: chainConfig?.iconColor || '#10B981' }}
                    />
                    <span>{chainConfig?.name || `Chain ${walletState.chainId}`}</span>
                    <span className="font-mono text-cyan-400">{formatAddress(walletState.address, 3)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={walletState.status === 'connecting'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                >
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span>{walletState.status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Connected Details Bar */}
          {isWalletConnected && (
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Address:</span>
                <span className="font-mono text-white text-xs bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                  {walletState.address}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!isProfileWalletLinked && (
                <button
                  type="button"
                  onClick={handleVerifyWalletOwnership}
                  disabled={isVerifyingSignature}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs transition-colors cursor-pointer"
                  title="Sign a cryptographic proof to link this wallet with your Mosaic username"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isVerifyingSignature ? 'Waiting for signature...' : 'Verify Wallet Ownership'}</span>
                </button>
              )}
            </div>
          )}

          {verificationFeedback && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {isWrongNetwork && (
            <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Wrong network detected. Switch to a supported EVM chain to view your NFTs.</span>
              </span>
              <button
                onClick={() => setWalletModalOpen(true)}
                className="underline font-bold text-amber-200 cursor-pointer shrink-0"
              >
                Switch Network
              </button>
            </div>
          )}
        </div>

        {/* 3. PROFILE TABS & CONTENT */}
        <div className="rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-4 sm:gap-6 border-b border-white/10 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('nfts')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'nfts'
                  ? 'text-cyan-300 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>My NFTs {isWalletConnected ? `(${ownedNfts.length})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'posts'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>My Posts ({userPosts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks ({bookmarkedPosts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'projects'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Projects ({userProjects.length})</span>
            </button>
          </div>

          <div className="pt-6">
            {/* TAB: MY NFTS */}
            {activeTab === 'nfts' && (
              <div className="space-y-6">
                {!isWalletConnected ? (
                  /* Disconnected State */
                  <div className="py-14 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg">
                      <Wallet className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Connect Wallet to View NFTs</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mosaic retrieves actual, verified on-chain ownership directly from the blockchain. We never hardcode or fabricate owned NFTs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={connectWallet}
                      disabled={walletState.status === 'connecting'}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity shadow-lg cursor-pointer"
                    >
                      {walletState.status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  </div>
                ) : (
                  /* Connected State: Real-time on-chain NFTs */
                  <div className="space-y-5">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input
                          type="text"
                          value={nftSearchQuery}
                          onChange={(e) => setNftSearchQuery(e.target.value)}
                          placeholder="Search owned NFTs by name, collection, or ID..."
                          className="w-full bg-[#060810] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Chain Filter */}
                        <div className="flex items-center gap-1 text-xs">
                          <Filter className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            value={selectedChainFilter ?? ''}
                            onChange={(e) =>
                              setSelectedChainFilter(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            className="bg-[#060810] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            <option value="">All Chains</option>
                            <option value="1">Ethereum</option>
                            <option value="8453">Base</option>
                            <option value="137">Polygon</option>
                            <option value="42161">Arbitrum</option>
                          </select>
                        </div>

                        {/* Force Refresh */}
                        <button
                          type="button"
                          onClick={() => fetchOwnedNfts(true)}
                          disabled={isLoadingNfts}
                          className="p-1.5 rounded-xl bg-[#060810] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Refresh on-chain NFTs"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingNfts ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {nftError && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{nftError}</span>
                      </div>
                    )}

                    {/* NFT Grid / Loading / Empty */}
                    {isLoadingNfts ? (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-purple-500 rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-400">
                          Retrieving genuine on-chain NFTs from Ethereum, Base, Polygon, & Arbitrum...
                        </p>
                      </div>
                    ) : filteredOwnedNfts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredOwnedNfts.map((nft) => (
                          <OwnedNftCard
                            key={nft.id}
                            nft={nft}
                            onSelect={(selected) => setSelectedDetailNft(selected)}
                            onCreateRelay={(selected) => setCreateRelayTarget(selected)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-slate-500 flex items-center justify-center mx-auto">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">No NFTs Found</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          No ERC-721 or ERC-1155 tokens were found for wallet{' '}
                          <span className="font-mono text-cyan-300">
                            {formatAddress(walletState.address, 3)}
                          </span>{' '}
                          on the selected network.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: POSTS */}
            {activeTab === 'posts' && (
              <div>
                {userPosts.length > 0 ? (
                  <div className="divide-y divide-white/[0.08]">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onSelectPost={onSelectPost}
                        onSelectUser={onSelectUser}
                        onSelectHashtag={onSelectHashtag}
                        onPostDeleted={(deletedId) => {
                          setUserPosts((prev) => prev.filter((p) => p.id !== deletedId));
                        }}
                        onPostEdited={(updated) => {
                          setUserPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">No posts yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      You haven&apos;t published any posts yet. Head over to the Social Hub to start sharing!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BOOKMARKS */}
            {activeTab === 'bookmarks' && (
              <div>
                {bookmarkedPosts.length > 0 ? (
                  <div className="divide-y divide-white/[0.08]">
                    {bookmarkedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onSelectPost={onSelectPost}
                        onSelectUser={onSelectUser}
                        onSelectHashtag={onSelectHashtag}
                        onPostDeleted={(deletedId) => {
                          setBookmarkedPosts((prev) => prev.filter((p) => p.id !== deletedId));
                        }}
                        onPostEdited={(updated) => {
                          setBookmarkedPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                        }}
                        onBookmarkRemoved={(removedId) => {
                          setBookmarkedPosts((prev) => prev.filter((p) => p.id !== removedId));
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">No bookmarks yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Bookmark interesting posts in your feed to view them here later.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && (
              <div>
                {userProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <img src={proj.logo} alt={proj.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                            <p className="text-xs text-cyan-400">@{proj.username}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">No NFT Projects created yet</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Launch a dedicated NFT project account to publish posts and create living artifact collections.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      <OwnedNftDetailModal
        nft={selectedDetailNft}
        onClose={() => setSelectedDetailNft(null)}
        onCreateRelay={(nft) => setCreateRelayTarget(nft)}
      />
      <CreateRelayModal
        isOpen={!!createRelayTarget}
        onClose={() => setCreateRelayTarget(null)}
        initialNft={createRelayTarget ? {
          name: createRelayTarget.name,
          image: createRelayTarget.image,
          collection: createRelayTarget.collectionName,
          tokenId: createRelayTarget.tokenId,
          contractAddress: createRelayTarget.contractAddress,
          chain: createRelayTarget.chain,
        } : undefined}
        onRelayCreated={(relay: any) => {
          setCreateRelayTarget(null);
          window.history.pushState({}, '', `/relay/${relay.id}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
      />
    </div>
  );
};
