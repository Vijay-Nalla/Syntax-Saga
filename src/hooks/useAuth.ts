import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { migrateGuestToAccount, usernameSyntheticEmail } from '@/game/saveSystem';

export type AuthMode = 'loading' | 'guest' | 'authed' | 'anon';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', s.user.id).maybeSingle();
          setProfileUsername((data as any)?.username ?? null);
        }, 0);
      } else {
        setProfileUsername(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session); setUser(data.session?.user ?? null);
      if (data.session?.user) {
        supabase.from('profiles').select('username').eq('user_id', data.session.user.id).maybeSingle()
          .then(({ data: p }) => setProfileUsername((p as any)?.username ?? null));
      }
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (username: string, password: string, recoveryEmail?: string) => {
    const email = recoveryEmail?.trim() ? recoveryEmail.trim() : usernameSyntheticEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username, recovery_email: recoveryEmail || null },
      },
    });
    if (error) return { error };
    // Persist recovery email on profile after creation (trigger creates row).
    if (data.user && recoveryEmail) {
      setTimeout(() => {
        supabase.from('profiles').update({ recovery_email: recoveryEmail }).eq('user_id', data.user!.id);
      }, 500);
    }
    // Migrate guest progress, if any
    await migrateGuestToAccount();
    return { error: null };
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    const email = usernameOrEmail.includes('@') ? usernameOrEmail : usernameSyntheticEmail(usernameOrEmail);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (recoveryEmail: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/`,
    });
    return { error };
  }, []);

  return { session, user, username: profileUsername, ready, signUp, signIn, signOut, resetPassword };
}
