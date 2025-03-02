import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

type UserProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
};

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSession(session.user);
      } else {
        setState({
          user: null,
          profile: null,
          isAdmin: false,
          loading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSession(user: User) {
    try {
      // Get the user's profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error) throw error;

      // If profile doesn't exist, create it
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([
            {
              id: user.id,
              display_name: user.email?.split('@')[0] || 'User',
              is_admin: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) throw createError;

        setState({
          user,
          profile: newProfile,
          isAdmin: newProfile?.is_admin ?? false,
          loading: false,
        });
        return;
      }

      setState({
        user,
        profile,
        isAdmin: profile?.is_admin ?? false,
        loading: false,
      });
    } catch (error) {
      console.error('Error handling session:', error);
      // Still set the user state even if profile fetch fails
      setState({
        user,
        profile: null,
        isAdmin: false,
        loading: false,
      });
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign in');

      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results case

      if (profileError) throw profileError;

      setState({
        user: data.user,
        profile,
        isAdmin: profile?.is_admin ?? false,
        loading: false,
      });

      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error?.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error?.message || 'Failed to sign in');
    }
  }

  async function signUp(email: string, password: string) {
    try {
      // First sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: email.split('@')[0], // Set a default display name
          }
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from sign up');

      // Create user profile using the service role client to bypass RLS
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user.id,
            display_name: email.split('@')[0], // Match the metadata
            bio: null,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select('*')
        .maybeSingle(); // Use maybeSingle instead of single to handle no results case

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // Don't throw here - the user is still created, they just might need to create their profile later
      }

      // Don't set the state here since the user needs to verify their email first
      toast.success('Please check your email to verify your account');
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error?.message?.includes('User already registered')) {
        throw new Error('An account with this email already exists');
      }
      throw new Error(error?.message || 'Failed to create account');
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        profile: null,
        isAdmin: false,
        loading: false,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}