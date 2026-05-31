import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (!hasSupabaseConfig) return undefined;

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthMessage(error.message);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function sendOtp(email) {
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      setAuthMessage(error.message);
      return false;
    }

    setAuthMessage('驗證碼已寄出，請到信箱查看 Email 驗證碼。');
    return true;
  }

  async function verifyOtp(email, otp) {
    setAuthMessage('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setAuthMessage(error.message);
      return false;
    }

    return true;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  const value = useMemo(
    () => ({
      authMessage,
      hasSupabaseConfig,
      loading,
      sendOtp,
      session,
      signOut,
      user: session?.user ?? null,
      verifyOtp,
    }),
    [authMessage, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
