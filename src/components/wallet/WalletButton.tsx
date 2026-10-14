import React, { useState } from 'react';
import { Wallet, ChevronDown, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { WalletModal } from './WalletModal';
import { formatAddress } from '../../constants/chains';

interface WalletButtonProps {
  className?: string;
  variant?: 'nav' | 'compact' | 'full';
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  className = '',
  variant = 'nav',
}) => {
  const { walletState, chainConfig, isWrongNetwork } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isConnected = walletState.status === 'connected' && !!walletState.address;
  const isConnecting = walletState.status === 'connecting';

  return (
    <>
      {isConnected ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
            isWrongNetwork
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-[#0f1426] hover:bg-[#151c35] text-white border-cyan-500/30 hover:border-cyan-400/50 shadow-sm'
          } ${className}`}
          title={isWrongNetwork ? 'Wrong network detected - Click to switch' : `Connected: ${walletState.address}`}
        >
          {isWrongNetwork ? (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Wrong Network</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full ring-2 ring-black"
                style={{ backgroundColor: chainConfig?.iconColor || '#10B981' }}
              />
              <span className="font-mono">{formatAddress(walletState.address, 3)}</span>
            </span>
          )}

          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isConnecting}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 hover:text-white shadow-sm ${className}`}
        >
          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isConnecting ? 'Connecting...' : variant === 'compact' ? 'Wallet' : 'Connect Wallet'}</span>
        </button>
      )}

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
