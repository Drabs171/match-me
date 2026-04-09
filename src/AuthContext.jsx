import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signup(name, email, password) {
    // Supabase native signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    if (data.user && !data.session) {
      return { success: true, requiresEmailConfirmation: true };
    }

    return { success: true, requiresEmailConfirmation: false };
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  // Send a password-reset email; redirectTo must be whitelisted in Supabase → Auth → URL Configuration
  async function resetPassword(email) {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Called from ResetPasswordPage after the user lands via the email link
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Utility to get the current access token for backend API calls
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout, getToken, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
