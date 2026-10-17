import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { nftOwnershipService } from '../../services/nftOwnershipService';
import { INITIAL_NFTS } from '../../services/nftService';
import { OwnedNft } from '../../types/wallet';
import { NFTReference } from '../../types';
import {
  X,
  Sparkles,
  Wallet,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  Check,
  Loader2,
  AlertCircle,
  Gem,
} from 'lucide-react';
import { resolveMediaUrl } from '../../services/nftOwnershipService';

interface NftAttachmentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (nft: NFTReference) => void;
}

export const NftAttachmentPicker: React.FC<NftAttachmentPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { walletState, connectWallet } = useWallet();
  const [tab, setTab] = useState<'wallet' | 'ecosystem' | 'custom'>('wallet');

  // Wallet owned NFTs
  const [ownedNfts, setOwnedNfts] = useState<OwnedNft[]>([]);
  const [isLoadingOwned, setIsLoadingOwned] = useState(false);
  const [ownedSearch, setOwnedSearch] = useState('');

  // Ecosystem NFTs
  const [ecosystemSearch, setEcosystemSearch] = useState('');

  // Custom NFT manual entry
  const [customNetwork, setCustomNetwork] = useState('Ethereum');
  const [customContract, setCustomContract] = useState('');
  const [customTokenId, setCustomTokenId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCollection, setCustomCollection] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isVerifyingCustom, setIsVerifyingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Load wallet NFTs when tab is wallet or address changes
  useEffect(() => {
    if (isOpen && walletState.address) {
      setIsLoadingOwned(true);
      nftOwnershipService
        .getOwnedNfts(walletState.address)
        .then((items) => setOwnedNfts(items))
        .catch(console.warn)
        .finally(() => setIsLoadingOwned(false));
    }
  }, [isOpen, walletState.address]);

  if (!isOpen) return null;

  const handleSelectOwned = (nft: OwnedNft) => {
    const reference: NFTReference = {
      network: nft.chain || 'Ethereum',
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      name: nft.name || `Token #${nft.tokenId}`,
      collectionName: nft.collectionName || 'Verified Collection',
      imageUrl: nft.image || '',
      externalUrl: nft.explorerUrl || `https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`,
      metadataVerified: true,
      ownerVerified: true, // Directly fetched from user's connected wallet!
    };
    onSelect(reference);
    onClose();
  };

  const handleSelectEcosystem = (item: (typeof INITIAL_NFTS)[0]) => {
    const reference: NFTReference = {
      network: 'Ethereum',
      tokenId: item.tokenId.replace('#', ''),
      name: item.name,
      collectionName: item.collection,
      imageUrl: item.image,
      externalUrl: 'https://mosaic.social/explore',
      metadataVerified: true,
      ownerVerified: false,
    };
    onSelect(reference);
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (!customTokenId.trim()) {
      setCustomError('Token identifier is required.');
      return;
    }
    if (!customName.trim()) {
      setCustomError('NFT name is required.');
      return;
    }

    setIsVerifyingCustom(true);
    try {
      let isVerified = false;
      if (customContract.trim() && /^0x[a-fA-F0-9]{40}$/.test(customContract.trim())) {
        const verifyResult = await nftOwnershipService.verifyCollectionContract(
          customContract.trim(),
          customNetwork === 'Base' ? 8453 : customNetwork === 'Polygon' ? 137 : customNetwork === 'Arbitrum' ? 42161 : 1
        );
        isVerified = verifyResult.verified;
      }

      const reference: NFTReference = {
        network: customNetwork,
        contractAddress: customContract.trim() || undefined,
        tokenId: customTokenId.trim(),
        name: customName.trim(),
        collectionName: customCollection.trim() || undefined,
        imageUrl: resolveMediaUrl(customImageUrl.trim()),
        externalUrl: customContract.trim() ? `https://etherscan.io/token/${customContract.trim()}?a=${customTokenId.trim()}` : undefined,
        metadataVerified: isVerified,
        ownerVerified: false,
      };

      onSelect(reference);
      onClose();
    } catch (err: any) {
      setCustomError(err.message || 'Failed to verify contract');
    } finally {
      setIsVerifyingCustom(false);
    }
  };

  const filteredOwned = ownedNfts.filter((nft) => {
    if (!ownedSearch.trim()) return true;
    const query = ownedSearch.toLowerCase();
    return (
      nft.name.toLowerCase().includes(query) ||
      (nft.collectionName && nft.collectionName.toLowerCase().includes(query)) ||
      nft.tokenId.includes(query)
    );
  });

  const filteredEcosystem = INITIAL_NFTS.filter((item) => {
    if (!ecosystemSearch.trim()) return true;
    const query = ecosystemSearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.collection.toLowerCase().includes(query) ||
      item.tokenId.toLowerCase().includes(query)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#090b16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-purple-500/30 flex items-center justify-center text-cyan-300">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Attach NFT to Post</h3>
              <p className="text-xs text-slate-400">Embed verified on-chain artwork and token provenance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#06070a]/60">
          <button
            onClick={() => setTab('wallet')}
            className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative ${
              tab === 'wallet' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>My Wallet NFTs</span>
            {walletState.address && ownedNfts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                {ownedNfts.length}
              </span>
            )}
            {tab === 'wallet' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setTab('ecosystem')}
            className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative ${
              tab === 'ecosystem' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Mosaic Ecosystem</span>
            {tab === 'ecosystem' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative ${
              tab === 'custom' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Custom Contract</span>
            {tab === 'custom' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'wallet' && (
            <div>
              {!walletState.address ? (
                <div className="text-center py-10 px-4 space-y-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Wallet Not Connected</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Connect your Web3 wallet (MetaMask, Coinbase, Rabby) to attach verified NFTs you own.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => connectWallet()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/30"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Web3 Wallet</span>
                  </button>
                </div>
              ) : isLoadingOwned ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
                  <p className="text-xs text-slate-400">Querying on-chain NFT ownership across Ethereum, Base, Polygon...</p>
                </div>
              ) : ownedNfts.length === 0 ? (
                <div className="text-center py-10 space-y-3 rounded-xl border border-white/5 bg-white/[0.01]">
                  <p className="text-sm text-slate-300 font-medium">No NFTs found in connected wallet.</p>
                  <p className="text-xs text-slate-500">
                    Switch networks or check out the Mosaic Ecosystem tab to attach featured NFTs.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('ecosystem')}
                    className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Browse Mosaic Ecosystem NFTs →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={ownedSearch}
                      onChange={(e) => setOwnedSearch(e.target.value)}
                      placeholder="Filter owned NFTs..."
                      className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredOwned.map((nft) => (
                      <button
                        key={nft.id}
                        type="button"
                        onClick={() => handleSelectOwned(nft)}
                        className="group p-2.5 rounded-xl bg-[#0e1224] border border-white/10 hover:border-cyan-400/50 hover:bg-[#121630] transition-all text-left flex flex-col gap-2 cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-white/5">
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                              <Gem className="w-8 h-8" />
                            </div>
                          )}
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Owner
                          </span>
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-semibold text-slate-300 border border-white/10">
                            {nft.chain || 'ETH'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {nft.name}
                          </p>
                          <p className="text-[10px] text-purple-400 truncate font-mono">
                            {nft.collectionName || `Token #${nft.tokenId}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'ecosystem' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={ecosystemSearch}
                  onChange={(e) => setEcosystemSearch(e.target.value)}
                  placeholder="Search Mosaic collection items..."
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredEcosystem.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectEcosystem(item)}
                    className="group p-2.5 rounded-xl bg-[#0e1224] border border-white/10 hover:border-purple-400/50 hover:bg-[#121630] transition-all text-left flex flex-col gap-2 cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-white/5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-cyan-300 flex items-center gap-1 border border-cyan-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{item.collection}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              {customError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{customError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Blockchain Network
                  </label>
                  <select
                    value={customNetwork}
                    onChange={(e) => setCustomNetwork(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Ethereum">Ethereum Mainnet</option>
                    <option value="Base">Base</option>
                    <option value="Polygon">Polygon</option>
                    <option value="Arbitrum">Arbitrum One</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Token ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTokenId}
                    onChange={(e) => setCustomTokenId(e.target.value)}
                    placeholder="e.g. 1847"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Contract Address (Optional for verification)
                </label>
                <input
                  type="text"
                  value={customContract}
                  onChange={(e) => setCustomContract(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    NFT Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Cyberpunk Relic #42"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={customCollection}
                    onChange={(e) => setCustomCollection(e.target.value)}
                    placeholder="e.g. Neo Tokyo Citizens"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Artwork Image URL (HTTPS, IPFS, or Arweave)
                </label>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://... or ipfs://..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {customImageUrl && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <img
                    src={resolveMediaUrl(customImageUrl)}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-slate-400 truncate">Artwork preview</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingCustom}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-purple-950/30 flex items-center gap-1.5"
                >
                  {isVerifyingCustom ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Attach to Post</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
