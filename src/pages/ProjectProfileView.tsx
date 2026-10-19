import React, { useState, useEffect } from 'react';
import { NftProjectAccount, SocialPost, NftItem } from '../types';
import { postService } from '../services/postService';
import { projectService } from '../services/projectService';
import { nftService } from '../services/nftService';
import { nftOwnershipService } from '../services/nftOwnershipService';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { PostCard } from '../components/social/PostCard';
import { OwnedNftCard } from '../components/nft/OwnedNftCard';
import { OwnedNftDetailModal } from '../components/nft/OwnedNftDetailModal';
import { OwnedNft } from '../types/wallet';
import { formatAddress } from '../constants/chains';
import { MosaicLogo } from '../components/brand/MosaicLogo';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Globe,
  Share2,
  Users,
  GitFork,
  ExternalLink,
  Layers,
  Calendar,
  Sparkles,
  Check,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Copy,
} from 'lucide-react';

interface ProjectProfileViewProps {
  project: NftProjectAccount;
  onBack: () => void;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const ProjectProfileView: React.FC<ProjectProfileViewProps> = ({
  project,
  onBack,
  onOpenReply,
  onOpenQuote,
  onSelectPost,
  onSelectUser,
  onSelectHashtag,
}) => {
  const { currentUser } = useAuth();
  const { walletState, connectWallet, signVerificationMessage } = useWallet();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'nfts' | 'relays' | 'about'>('posts');
  const [isFollowing, setIsFollowing] = useState(() => {
    if (!currentUser) return false;
    return projectService.getFollowedProjectIds(currentUser.id).includes(project.id);
  });
  const [copiedShare, setCopiedShare] = useState(false);
  const [currentProject, setCurrentProject] = useState<NftProjectAccount>(project);

  // Verified Collection State
  const [verifiedCollectionNfts, setVerifiedCollectionNfts] = useState<OwnedNft[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [selectedNftDetail, setSelectedNftDetail] = useState<OwnedNft | null>(null);

  // Contract verification action state
  const [inputContract, setInputContract] = useState(currentProject.collection?.contractAddress || '');
  const [isVerifyingContract, setIsVerifyingContract] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);

  const isOwnerOfProject = currentUser && currentUser.id === currentProject.ownerId;

  const handleToggleFollow = () => {
    if (!currentUser) return;
    const nowFollowing = projectService.toggleFollowProject(currentProject.id, currentUser.id);
    setIsFollowing(nowFollowing);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Load verified collection tokens if project has a verified contract
  useEffect(() => {
    const loadTokens = async () => {
      const contract = currentProject.collection?.contractAddress;
      const isVerified = currentProject.collection?.verificationStatus === 'verified';
      if (contract && isVerified) {
        setIsLoadingCollection(true);
        try {
          const tokens = await nftOwnershipService.getCollectionTokens(contract, 1);
          setVerifiedCollectionNfts(tokens);
        } catch (e) {
          console.warn('Failed loading collection tokens', e);
        } finally {
          setIsLoadingCollection(false);
        }
      }
    };

    if (activeTab === 'nfts') {
      loadTokens();
    }
  }, [activeTab, currentProject.collection]);

  // Execute on-chain smart contract cryptographic verification
  const handleVerifyContractOnChain = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);
    setVerificationSuccess(null);

    const targetAddr = inputContract.trim();
    if (!targetAddr || !/^0x[a-fA-F0-9]{40}$/.test(targetAddr)) {
      setVerificationError('Please enter a valid 42-character 0x EVM contract address.');
      return;
    }

    if (!walletState.address) {
      setVerificationError('Please connect your Web3 wallet first to verify contract ownership.');
      return;
    }

    setIsVerifyingContract(true);
    try {
      // Step 1: verify contract exists on-chain and check its owner
      const result = await nftOwnershipService.verifyCollectionContract(
        targetAddr,
        walletState.chainId || 1,
        walletState.address
      );

      if (!result.verified) {
        setVerificationError(result.message);
        return;
      }

      // Step 2: request cryptographic signature from project owner to seal verification claim
      const verifyMsg = `Mosaic Verified NFT Collection Claim\n\nProject: @${currentProject.username} (${currentProject.name})\nContract Address: ${targetAddr}\nManager Wallet: ${walletState.address}\nChain ID: ${walletState.chainId || 1}\nTimestamp: ${new Date().toISOString()}`;
      const sig = await signVerificationMessage(verifyMsg);

      if (!sig) {
        setVerificationError('Signature request was declined. Verification requires cryptographic confirmation.');
        return;
      }

      // Step 3: update project status to verified in database and state
      const updated = await projectService.updateCollectionVerification(
        currentProject.id,
        'verified',
        targetAddr,
        result.totalSupply ? Number(result.totalSupply) : 1000
      );

      if (updated) {
        setCurrentProject(updated);
        setVerificationSuccess(`Successfully verified! Smart contract ${result.name || ''} (${formatAddress(targetAddr, 3)}) is now cryptographically linked.`);
      }
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingContract(false);
    }
  };

  const handleCopyContract = () => {
    if (currentProject.collection?.contractAddress) {
      navigator.clipboard.writeText(currentProject.collection.contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  // Find posts by this project
  const projectPosts = postService.getUserPosts(currentProject.username);

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 border-x border-white/5 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MosaicLogo size="sm" />
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{currentProject.name}</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-slate-400">NFT Project Identity</p>
          </div>
        </div>

        {copiedShare && (
          <span className="text-xs font-semibold text-cyan-400 animate-in fade-in">
            Link copied!
          </span>
        )}
      </div>

      {/* Project Banner & Logo Header */}
      <div className="relative">
        <div className="h-36 sm:h-52 bg-slate-900 overflow-hidden relative border-b border-white/5">
          <img
            src={currentProject.banner}
            alt={currentProject.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-transparent to-black/30" />
        </div>

        <div className="px-5 pb-4">
          {/* Logo & Follow Action Row */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
            <div className="relative">
              <img
                src={currentProject.logo}
                alt={currentProject.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-[#06070a] shadow-xl border border-cyan-500/30"
              />
              <span className="absolute bottom-1 right-1 p-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Layers className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full border border-white/15 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Share Project"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleFollow}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                    : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isFollowing ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Following
                  </span>
                ) : (
                  'Follow'
                )}
              </button>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentProject.name}
                </h1>
                {currentProject.collection?.verificationStatus === 'verified' ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"
                    title="Cryptographically Verified Collection"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Collection
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"
                    title="Collection unverified on-chain"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-400 font-semibold mt-0.5">
                @{currentProject.username}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {currentProject.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Joined {new Date(currentProject.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>

              {currentProject.website && (
                <a
                  href={currentProject.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <span className="flex items-center gap-1 text-slate-300">
                <strong className="text-white">{currentProject.followersCount}</strong> Followers
              </span>

              <span className="flex items-center gap-1 text-slate-300">
                <strong className="text-white">{currentProject.relaysCount}</strong> Relays
              </span>
            </div>
          </div>
        </div>

        {/* Project Navigation Tabs */}
        <div className="flex border-b border-white/10 mt-3 px-2 overflow-x-auto">
          {(['posts', 'nfts', 'media', 'relays', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-bold capitalize transition-colors border-b-2 cursor-pointer shrink-0 ${
                activeTab === tab
                  ? 'text-white border-purple-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {tab === 'nfts' ? 'NFT Collection' : tab}
            </button>
          ))}
        </div>

        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <div className="divide-y divide-white/5">
            {projectPosts.length > 0 ? (
              projectPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onOpenReply={onOpenReply}
                  onOpenQuote={onOpenQuote}
                  onSelectUser={onSelectUser}
                  onSelectHashtag={onSelectHashtag}
                />
              ))
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <p>No posts published by @{currentProject.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: NFT Collection (Strict Verification Enforcement) */}
        {activeTab === 'nfts' && (
          <div className="p-4 sm:p-6 space-y-6">
            {currentProject.collection ? (
              <div className="space-y-5">
                {/* Collection Meta Card */}
                <div className="p-5 rounded-2xl bg-[#090d1c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{currentProject.collection.name}</h3>
                      {currentProject.collection.verificationStatus === 'verified' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Cryptographically Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Unverified Collection
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {currentProject.collection.itemsCount || 'Collection'} Items · Provenance:{' '}
                      <span className="capitalize text-slate-200 font-medium">
                        {currentProject.collection.verificationStatus}
                      </span>
                    </p>
                  </div>

                  {currentProject.collection.contractAddress && (
                    <div className="flex items-center gap-2 bg-[#060810] px-3 py-1.5 rounded-xl border border-white/5 text-xs font-mono">
                      <span className="text-slate-400">{formatAddress(currentProject.collection.contractAddress, 4)}</span>
                      <button
                        onClick={handleCopyContract}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title="Copy contract address"
                      >
                        {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://etherscan.io/token/${currentProject.collection.contractAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                        title="View contract on explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Display Verified Collection vs Unverified Enforcement */}
                {currentProject.collection.verificationStatus === 'verified' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Verified On-Chain Pieces ({verifiedCollectionNfts.length})</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Live On-Chain Data
                      </span>
                    </div>

                    {isLoadingCollection ? (
                      <div className="py-12 text-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                        <p className="text-xs text-slate-400">Loading verified smart contract items...</p>
                      </div>
                    ) : verifiedCollectionNfts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {verifiedCollectionNfts.map((nft) => (
                          <OwnedNftCard
                            key={nft.id}
                            nft={nft}
                            onSelect={(selected) => setSelectedNftDetail(selected)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-[#080b18] border border-white/5 text-center text-xs text-slate-400">
                        Smart contract verified. No tokens currently indexed on the primary RPC endpoint.
                      </div>
                    )}
                  </div>
                ) : (
                  /* STRICT NOTICE: Do not claim a project owns a collection without verification */
                  <div className="p-6 sm:p-8 rounded-2xl bg-[#080b18] border border-white/10 text-center space-y-4 max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-white">Unverified Smart Contract Collection</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mosaic strictly enforces cryptographic integrity: we do not claim a project owns a collection without verified on-chain cryptographic proof from the deploying or owning wallet.
                      </p>
                    </div>

                    {/* Verification Action (For Project Owner) */}
                    {isOwnerOfProject ? (
                      <div className="pt-2 text-left bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>Verify Ownership as Project Manager</span>
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Connect the wallet that deployed or currently owns this collection contract and submit for instant verification.
                        </p>

                        <form onSubmit={handleVerifyContractOnChain} className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                              EVM Contract Address (0x...)
                            </label>
                            <input
                              type="text"
                              value={inputContract}
                              onChange={(e) => setInputContract(e.target.value)}
                              placeholder="0x..."
                              className="w-full bg-[#060810] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                              required
                            />
                          </div>

                          {verificationError && (
                            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                              {verificationError}
                            </div>
                          )}

                          {verificationSuccess && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                              {verificationSuccess}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            {!walletState.address ? (
                              <button
                                type="button"
                                onClick={connectWallet}
                                className="w-full py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                <span>Connect Wallet First</span>
                              </button>
                            ) : (
                              <button
                                type="submit"
                                disabled={isVerifyingContract}
                                className="w-full py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                {isVerifyingContract ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Verifying On-Chain...</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Verify Smart Contract On-Chain</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Only the project administrator can cryptographically verify contract provenance.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#090d1c] border border-white/10 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Collection Linked</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  This project has not linked an on-chain NFT collection yet. When added, ownership will be verified before display.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Media */}
        {activeTab === 'media' && (
          <div className="p-4">
            {projectPosts.flatMap((p: SocialPost) => p.mediaUrls || []).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {projectPosts
                  .flatMap((p: SocialPost) => p.mediaUrls || [])
                  .map((url: string, i: number) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-white/5 group relative"
                    >
                      <img
                        src={url}
                        alt="Project media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <p>No media files uploaded by @{currentProject.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Relays */}
        {activeTab === 'relays' && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-4 h-4" />
                  Associated Relays ({currentProject.relaysCount})
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Living artifact forks initiated by {currentProject.name}.
                </p>
              </div>
            </div>

            {currentProject.relaysCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nftService.getAllNfts().slice(0, currentProject.relaysCount).map((nft: NftItem) => (
                  <div key={nft.id} className="p-3 rounded-2xl bg-[#0a0d1a] border border-white/10 flex items-center gap-3">
                    <img src={nft.image} alt={nft.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{nft.name}</p>
                      <p className="text-[11px] text-slate-400">{nft.collection}</p>
                      <span className="text-[10px] text-cyan-400 font-semibold">{nft.relaysCount} Collaborators</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <GitFork className="w-6 h-6 mx-auto text-slate-600" />
                <p>No active Relays co-created with @{currentProject.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: About */}
        {activeTab === 'about' && (
          <div className="p-5 space-y-6 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-[#090d1a] border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white">Manifesto & Mission</h4>
              <p>{currentProject.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090d1a] border border-white/10 space-y-2">
              <h4 className="text-sm font-bold text-white">Project Identity & Provenance</h4>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Classification:</span>
                  <p className="font-semibold text-white">{currentProject.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">Verification Status:</span>
                  <p className="font-semibold text-cyan-400 capitalize">
                    {currentProject.collection?.verificationStatus || 'Community Project'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <OwnedNftDetailModal nft={selectedNftDetail} onClose={() => setSelectedNftDetail(null)} />
    </div>
  );
};
