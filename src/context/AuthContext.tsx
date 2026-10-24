import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, setCachedAccessToken } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  authError: string | null;
  clearAuthError: () => void;
  signIn: (withScope?: 'standard' | 'drive' | 'youtube' | boolean) => Promise<void>;
  signOut: () => Promise<void>;
  requestDriveToken: () => Promise<string>;
  requestYouTubeToken: () => Promise<string>;
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  authError: null,
  clearAuthError: () => {},
  signIn: async () => {},
  signOut: async () => {},
  requestDriveToken: async () => '',
  requestYouTubeToken: async () => '',
  isSyncing: false,
  setIsSyncing: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check if user just returned from a redirect sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setAccessToken(credential.accessToken);
            setCachedAccessToken(credential.accessToken);
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect auth check notice:', err?.code || err?.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setAccessToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (withScope: 'standard' | 'drive' | 'youtube' | boolean = 'standard') => {
    try {
      setAuthError(null);
      const res = await signInWithGoogle(withScope);
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
      }
    } catch (error: any) {
      console.warn('Login notice:', error?.message || error);
      setAuthError(error?.message || 'লগইন ব্যর্থ হয়েছে');
      throw error;
    }
  };

  const handleRequestDriveToken = async (): Promise<string> => {
    try {
      setAuthError(null);
      const res = await signInWithGoogle(true);
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        return res.accessToken;
      }
      throw new Error('এক্সেস টোকেন পাওয়া যায়নি');
    } catch (error: any) {
      console.warn('Drive token request notice:', error?.message || error);
      setAuthError(error?.message || 'Drive সংযোগ ব্যর্থ হয়েছে');
      throw error;
    }
  };

  const handleRequestYouTubeToken = async (): Promise<string> => {
    try {
      setAuthError(null);
      const res = await signInWithGoogle('youtube');
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        return res.accessToken;
      }
      throw new Error('এক্সেস টোকেন পাওয়া যায়নি');
    } catch (error: any) {
      console.warn('YouTube token request notice:', error?.message || error);
      setAuthError(error?.message || 'YouTube সংযোগ ব্যর্থ হয়েছে');
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setAccessToken(null);
      setAuthError(null);
    } catch (error) {
      console.warn('Logout notice:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        authError,
        clearAuthError: () => setAuthError(null),
        signIn: handleSignIn,
        signOut: handleSignOut,
        requestDriveToken: handleRequestDriveToken,
        requestYouTubeToken: handleRequestYouTubeToken,
        isSyncing,
        setIsSyncing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
