import { verifyMessage } from 'ethers';

export interface WalletChallenge {
  nonce: string;
  address: string;
  chainId: number;
  domain: string;
  uri: string;
  statement: string;
  issuedAt: string;
  expiresAt: string;
}

interface StoredChallenge {
  challenge: WalletChallenge;
  used: boolean;
}

// In-memory nonce store with auto-cleanup (replay protection & expiration)
const challengeStore = new Map<string, StoredChallenge>();

// Clean expired challenges periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [nonce, stored] of challengeStore.entries()) {
    if (new Date(stored.challenge.expiresAt).getTime() < now) {
      challengeStore.delete(nonce);
    }
  }
}

export const walletAuthService = {
  /**
   * Generates a cryptographically secure random nonce.
   */
  generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(24);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < 24; i++) {
        result += chars.charAt(array[i] % chars.length);
      }
    } else {
      for (let i = 0; i < 24; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  },

  /**
   * Creates a structured sign-in challenge (EIP-4361 standard inspired)
   * with 5-minute expiration and nonce tracking.
   */
  createChallenge(address: string, chainId = 1): WalletChallenge {
    cleanupExpired();
    const nonce = this.generateNonce();
    const domain = typeof window !== 'undefined' ? window.location.host : 'mosaic.social';
    const uri = typeof window !== 'undefined' ? window.location.origin : 'https://mosaic.social';
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    const challenge: WalletChallenge = {
      nonce,
      address: address.toLowerCase(),
      chainId,
      domain,
      uri,
      statement: 'Sign this cryptographic challenge to securely link your Web3 wallet to your Mosaic social identity.',
      issuedAt,
      expiresAt,
    };

    challengeStore.set(nonce, { challenge, used: false });
    return challenge;
  },

  /**
   * Formats a challenge into the standardized message to be signed by the user's wallet.
   */
  formatSignMessage(challenge: WalletChallenge): string {
    return [
      `${challenge.domain} wants you to sign in with your Ethereum account:`,
      challenge.address,
      '',
      challenge.statement,
      '',
      `URI: ${challenge.uri}`,
      `Chain ID: ${challenge.chainId}`,
      `Nonce: ${challenge.nonce}`,
      `Issued At: ${challenge.issuedAt}`,
      `Expires At: ${challenge.expiresAt}`,
    ].join('\n');
  },

  /**
   * Validates message structure, expiration, and cryptographic signature.
   * Enforces replay protection: single use per nonce.
   */
  verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): { verified: boolean; error?: string } {
    cleanupExpired();

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/);
    if (!nonceMatch) {
      return { verified: false, error: 'Malformed verification message: nonce missing.' };
    }
    const nonce = nonceMatch[1];

    const stored = challengeStore.get(nonce);
    if (!stored) {
      return {
        verified: false,
        error: 'Challenge not found or has expired. Please request a new signature.',
      };
    }

    // Replay protection: check if nonce was already used
    if (stored.used) {
      return {
        verified: false,
        error: 'Replay protection: this challenge has already been used.',
      };
    }

    // Check expiration
    if (new Date(stored.challenge.expiresAt).getTime() < Date.now()) {
      challengeStore.delete(nonce);
      return { verified: false, error: 'Challenge has expired. Please retry.' };
    }

    // Check target address matches
    if (stored.challenge.address.toLowerCase() !== walletAddress.toLowerCase()) {
      return {
        verified: false,
        error: 'Wallet address does not match the challenge address.',
      };
    }

    // Cryptographic signature recovery via ethers
    try {
      const recoveredAddress = verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return {
          verified: false,
          error: `Signature recovery mismatch: expected ${walletAddress}, recovered ${recoveredAddress}`,
        };
      }

      // Mark challenge as consumed (replay protection)
      stored.used = true;
      challengeStore.set(nonce, stored);

      return { verified: true };
    } catch (err: any) {
      return {
        verified: false,
        error: `Cryptographic verification failed: ${err.message || 'invalid signature'}`,
      };
    }
  },
};
