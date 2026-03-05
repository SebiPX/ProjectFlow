import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '../types/auth';
import type { Profile } from '../types/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // We no longer need to fetch the profile separately.
  // The custom backend returns the profile fields (full_name, avatar_url) directly inside the user object from /auth/login and /auth/me.
  const fetchProfile = async (userId: string, token: string) => {
    return null; // Deprecated
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedSessionStr = localStorage.getItem('agency_session');
        if (storedSessionStr) {
          const storedSession = JSON.parse(storedSessionStr) as Session;
          
          // Verify with backend (optional but good practice)
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedSession.access_token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            // `data` from /auth/me contains id, email, full_name, avatar_url, role
            
            // Merge user data with the token for valid session
            const newSession = { ...storedSession, user: { ...storedSession.user, ...data } };
            setSession(newSession);
            setUser(newSession.user);
            
            // In our custom backend, the user object IS the profile
            setProfile(data as unknown as Profile);
          } else {
            // Invalid session
            localStorage.removeItem('agency_session');
          }
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    const newSession: Session = {
      access_token: data.token || data.access_token,
      user: data.user
    };

    localStorage.setItem('agency_session', JSON.stringify(newSession));
    setSession(newSession);
    setUser(newSession.user);

    // Profile is just the user object from our backend
    if (newSession.user) {
      setProfile(newSession.user as unknown as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user && session) {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data as unknown as Profile);
        setUser(data);
      }
    }
  };

  const signOut = async () => {
    if (session) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      } catch (err) {
        console.error('Logout API failed, continuing client logout', err);
      }
    }
    
    localStorage.removeItem('agency_session');
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
