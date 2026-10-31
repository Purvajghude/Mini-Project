import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, session } from './api';
import type { AuthResponse, Profile } from './types';

type AuthState =
  | { status: 'loading'; profile: null }
  | { status: 'anonymous'; profile: null }
  | { status: 'signed-in'; profile: Profile };

interface AuthContextValue {
  state: AuthState;
  signIn(auth: AuthResponse): void;
  signOut(): void;
  setProfile(profile: Profile): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => (session.load() ? { status: 'loading', profile: null } : { status: 'anonymous', profile: null }));

  const signOut = useCallback(() => {
    session.clear();
    setState({ status: 'anonymous', profile: null });
  }, []);

  useEffect(() => {
    session.onUnauthorized(signOut);
    if (state.status !== 'loading') return;
    api.me().then((profile) => setState({ status: 'signed-in', profile })).catch(signOut);
    // Restore once on boot only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    signOut,
    signIn(auth) {
      session.save(auth);
      setState({ status: 'signed-in', profile: auth.user });
    },
    setProfile(profile) { setState({ status: 'signed-in', profile }); },
  }), [state, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/** For screens that only render when signed in. */
export function useMe(): Profile {
  const { state } = useAuth();
  if (state.status !== 'signed-in') throw new Error('useMe requires a signed-in session');
  return state.profile;
}
