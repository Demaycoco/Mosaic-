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
  const [authState, setAuthState] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for incoming redirect authentication results on load
    authService.checkRedirectResult().catch((err) => {
      console.warn('Redirect auth check notice:', err);
    });

    // Subscribe to authService state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setErrorCode(null);
    setAuthState('loading');
    try {
      const result = await authService.signInWithGoogle();
      setCurrentUser(result.user);
      setAuthState('authenticated');
      return result;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setErrorCode(err.code || null);
      setAuthState(currentUser ? 'authenticated' : 'unauthenticated');
      throw err;
    }
  };

  const signInWithGoogleRedirect = async () => {
    setError(null);
    setErrorCode(null);
    setAuthState('loading');
    try {
      await authService.signInWithGoogleRedirect();
    } catch (err: any) {
      setError(err.message || 'Google redirect failed');
      setErrorCode(err.code || null);
      setAuthState(currentUser ? 'authenticated' : 'unauthenticated');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    setErrorCode(null);
    setAuthState('loading');
    try {
      const user = await authService.signInWithEmail(email, password);
      setCurrentUser(user);
      setAuthState('authenticated');
      return user;
    } catch (err: any) {
      setError(err.message || 'Email sign-in failed');
      setErrorCode(err.code || null);
      setAuthState(currentUser ? 'authenticated' : 'unauthenticated');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    setError(null);
    setErrorCode(null);
    setAuthState('loading');
    try {
      const user = await authService.signUpWithEmail(email, password, displayName);
      setCurrentUser(user);
      setAuthState('authenticated');
      return user;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setErrorCode(err.code || null);
      setAuthState(currentUser ? 'authenticated' : 'unauthenticated');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    setErrorCode(null);
    try {
      await authService.signOut();
      setCurrentUser(null);
      setAuthState('unauthenticated');
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
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
