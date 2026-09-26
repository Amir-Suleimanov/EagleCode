/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { dataClient, useHttpDataSource } from '../services/client';
import type { LoginInput, RegisterInput, SessionUser } from '../types';

interface AuthContextValue {
  user: SessionUser | null;
  login: (input: LoginInput) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => void;
}

const SESSION_KEY = 'eaglecode.session.v1';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) as SessionUser : null;
  });

  const persist = (session: SessionUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  useEffect(() => {
    const clear = () => { localStorage.removeItem(SESSION_KEY); setUser(null); };
    window.addEventListener('eaglecode:auth-expired', clear);
    if (useHttpDataSource && user) dataClient.getCurrentUser().then(persist).catch(clear);
    return () => window.removeEventListener('eaglecode:auth-expired', clear);
  // Session verification is intentionally limited to provider mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: async (input) => persist(await dataClient.login(input)),
    register: async (input) => persist(await dataClient.register(input)),
    logout: () => { void dataClient.logout(); localStorage.removeItem(SESSION_KEY); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
