import React, { createContext, useContext, useEffect, useState } from 'react';
import { MosaicUser } from '../types';
import { authService } from '../services/authService';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  currentUser: MosaicUser | null;
  user: MosaicUser | null; // convenient alias
  authState: AuthStatus;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  signInWithGoogle: () => Promise<{ user: MosaicUser; isNewUser: boolean }>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<MosaicUser>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<MosaicUser>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<Omit<MosaicUser, 'id' | 'email' | 'createdAt'>>) => Promise<MosaicUser>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MosaicUser | null>(() => authService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(() => !authService.isAuthReady());
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check for incoming redirect authentication results on load
    authService.checkRedirectResult().catch((err) => {
      console.warn('Redirect auth check notice:', err);
    });

    // Subscribe to authService state changes
    const unsubscribe = authService.onAuthStateChanged((user, isInitialResolved) => {
      if (!isMounted) return;
      setCurrentUser(user);
      if (isInitialResolved !== false) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const authState: AuthStatus = loading
    ? 'loading'
    : currentUser
    ? 'authenticated'
    : 'unauthenticated';

  const signInWithGoogle = async () => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      setCurrentUser(result.user);
      return result;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setErrorCode(err.code || null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleRedirect = async () => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      await authService.signInWithGoogleRedirect();
    } catch (err: any) {
      setError(err.message || 'Google redirect failed');
      setErrorCode(err.code || null);
      setLoading(false);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const user = await authService.signInWithEmail(email, password);
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Email sign-in failed');
      setErrorCode(err.code || null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const user = await authService.signUpWithEmail(email, password, displayName);
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setErrorCode(err.code || null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      await authService.signOut();
      setCurrentUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    updates: Partial<Omit<MosaicUser, 'id' | 'email' | 'createdAt'>>
  ): Promise<MosaicUser> => {
    try {
      const updated = await authService.updateUserProfile(updates);
      setCurrentUser(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        authState,
        loading: authState === 'loading',
        error,
        errorCode,
        signInWithGoogle,
        signInWithGoogleRedirect,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
