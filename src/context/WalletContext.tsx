import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { WalletState, ChainConfig } from '../types/wallet';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, getChainConfig } from '../constants/chains';

interface WalletContextType {
  walletState: WalletState;
  chainConfig?: ChainConfig;
  isWrongNetwork: boolean;
  supportedChains: ChainConfig[];
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  signVerificationMessage: (message: string) => Promise<string | null>;
  clearWalletError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Extend Window interface for standard Ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    chainId: null,
    chainName: null,
    ensName: null,
    error: null,
    providerName: null,
  });

  const clearWalletError = useCallback(() => {
    setWalletState((prev) => ({ ...prev, error: null }));
  }, []);

  const detectProvider = () => {
    if (typeof window === 'undefined') return null;
    return window.ethereum || null;
  };

  // Helper to extract clean error messages
  const parseWalletError = (err: any): string => {
    if (!err) return 'An unknown wallet error occurred.';
    
    // User rejected action in wallet (EIP-1193 standard 4001)
    if (err.code === 4001 || err.code === 'ACTION_REJECTED' || err.message?.includes('User rejected') || err.message?.includes('user rejected')) {
      return 'Action was rejected by the user in the wallet.';
    }

    // Wrong network or chain switch rejected (4902 is chain not added)
    if (err.code === 4902) {
      return 'The requested network is not added to your wallet.';
    }

    // Already pending request (code -32002)
    if (err.code === -32002) {
      return 'A request is already pending in your wallet. Please open your wallet extension to approve or cancel it.';
    }

    if (err.message) {
      // Clean up common provider prefix strings
      return err.message.replace(/^.*Error:\s*/, '').slice(0, 150);
    }

    return 'Network or wallet communication error. Please try again.';
  };

  const updateAccountAndChain = useCallback(async (provider: any, accounts: string[]) => {
    if (!accounts || accounts.length === 0) {
      setWalletState({
        status: 'disconnected',
        address: null,
        chainId: null,
        chainName: null,
        ensName: null,
        error: null,
        providerName: null,
      });
      return;
    }

    try {
      const browserProvider = new BrowserProvider(provider);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      const config = getChainConfig(currentChainId);

      let ens: string | null = null;
      if (currentChainId === 1) {
        try {
          ens = await browserProvider.lookupAddress(accounts[0]);
        } catch {
          // ignore ENS lookup failure
        }
      }

      setWalletState({
        status: 'connected',
        address: accounts[0],
        chainId: currentChainId,
        chainName: config ? config.name : `Chain ${currentChainId}`,
        ensName: ens,
        error: null,
        providerName: provider.isMetaMask ? 'MetaMask' : provider.isCoinbaseWallet ? 'Coinbase' : 'Web3 Wallet',
      });
    } catch (err: any) {
      console.warn('Error reading network after account change', err);
      setWalletState((prev) => ({
        ...prev,
        status: 'connected',
        address: accounts[0],
        error: null,
      }));
    }
  }, []);

  // Connect Wallet handler
  const connectWallet = useCallback(async () => {
    const provider = detectProvider();

    if (!provider) {
      setWalletState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No Web3 wallet extension found. Please install MetaMask, Coinbase Wallet, or Rabby to connect.',
      }));
      return;
    }

    setWalletState((prev) => ({
      ...prev,
      status: 'connecting',
      error: null,
    }));

    try {
      // EIP-1102 request accounts (never silently, prompts user explicitly)
      const accounts: string[] = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in wallet.');
      }

      await updateAccountAndChain(provider, accounts);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      const message = parseWalletError(err);
      setWalletState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, [updateAccountAndChain]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      status: 'disconnected',
      address: null,
      chainId: null,
      chainName: null,
      ensName: null,
      error: null,
      providerName: null,
    });
  }, []);

  // Switch network (with prompt to add chain if not present)
  const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
    const provider = detectProvider();
    if (!provider) {
      setWalletState((prev) => ({
        ...prev,
        error: 'Wallet provider not available to switch networks.',
      }));
      return false;
    }

    const targetConfig = getChainConfig(targetChainId);
    if (!targetConfig) {
      setWalletState((prev) => ({
        ...prev,
        error: `Network ${targetChainId} is not supported.`,
      }));
      return false;
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added to the wallet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: targetConfig.name,
                nativeCurrency: targetConfig.nativeCurrency,
                rpcUrls: targetConfig.rpcUrls,
                blockExplorerUrls: targetConfig.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError: any) {
          const msg = parseWalletError(addError);
          setWalletState((prev) => ({ ...prev, error: msg }));
          return false;
        }
      }

      const msg = parseWalletError(switchError);
      setWalletState((prev) => ({ ...prev, error: msg }));
      return false;
    }
  }, []);

  // Explicit user-driven message signature for cryptographic verification
  // Never called silently - always explicitly triggered by user action!
  const signVerificationMessage = useCallback(async (message: string): Promise<string | null> => {
    const provider = detectProvider();
    if (!provider || !walletState.address) {
      setWalletState((prev) => ({
        ...prev,
        error: 'Please connect your wallet first before verifying.',
      }));
      return null;
    }

    try {
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (err: any) {
      console.error('Signature rejected or failed:', err);
      const msg = parseWalletError(err);
      setWalletState((prev) => ({ ...prev, error: msg }));
      return null;
    }
  }, [walletState.address]);

  // Listen to provider events (accountsChanged, chainChanged, disconnect)
  useEffect(() => {
    const provider = detectProvider();
    if (!provider || !provider.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      updateAccountAndChain(provider, accounts);
    };

    const handleChainChanged = (_chainIdHex: string) => {
      // Re-read accounts & network
      if (provider.request) {
        provider.request({ method: 'eth_accounts' }).then((accs: string[]) => {
          updateAccountAndChain(provider, accs);
        }).catch(console.warn);
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    // Check if wallet is already connected without prompting (silent check for existing authorization)
    if (provider.request) {
      provider.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            updateAccountAndChain(provider, accounts);
          }
        })
        .catch(() => {
          // Ignore silent check errors
        });
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
        provider.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [updateAccountAndChain, disconnectWallet]);

  const chainConfig = getChainConfig(walletState.chainId);
  const isWrongNetwork = walletState.status === 'connected' && walletState.chainId !== null && !chainConfig;
  const supportedChainsList = Object.values(SUPPORTED_CHAINS);

  return (
    <WalletContext.Provider
      value={{
        walletState,
        chainConfig,
        isWrongNetwork,
        supportedChains: supportedChainsList,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        signVerificationMessage,
        clearWalletError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
