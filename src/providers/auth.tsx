/**
 * Keeps track of who is signed in and shares it with every screen.
 * Supabase remembers the session on the phone, so users stay signed in
 * after closing the app.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type Auth = {
  session: Session | null;
  /** True until we know whether someone is signed in. */
  isLoading: boolean;
};

const AuthContext = createContext<Auth>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setIsLoading(false));

    // Fires on sign in, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** The signed-in user's first name and email, for display. */
export function useCurrentUser() {
  const { session } = useAuth();
  const user = session?.user;
  const firstName = (user?.user_metadata?.first_name as string | undefined) ?? '';
  return { id: user?.id, email: user?.email ?? '', firstName };
}
