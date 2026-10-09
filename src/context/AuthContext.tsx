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
  signInWithGoogle: (options?: {
    customEmail?: string;
    customName?: string;
    customPhoto?: string;
  }) => Promise<{ user: MosaicUser; isNewUser: boolean }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<Omit<MosaicUser, 'id' | 'email' | 'createdAt'>>) => Promise<MosaicUser>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MosaicUser | null>(() => authService.getCurrentUser());
  const [authState, setAuthState] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  const signInWithGoogle = async (options?: {
    customEmail?: string;
    customName?: string;
    customPhoto?: string;
  }) => {
    setError(null);
    setAuthState('loading');
    try {
      const result = await authService.signInWithGoogle(options);
      setCurrentUser(result.user);
      setAuthState('authenticated');
      return result;
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setAuthState('error');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
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

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        authState,
        loading: authState === 'loading',
        error,
        signInWithGoogle,
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
