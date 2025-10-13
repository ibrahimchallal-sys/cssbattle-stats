import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  cssbattle_profile_link?: string;
  email_confirmed_at?: string;
  group?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  register: (userData: { fullName: string; email: string; cssbattleProfileLink?: string; password: string; group: string }) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  checkEmailVerification: () => Promise<{ isVerified: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user profile data
        const { data: profile, error } = await supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, "group"')
          .eq('email', session.user.email)
          .single();
        
        if (!error && profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: session.user.email_confirmed_at,
            group: profile.group
          });
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Get user profile data
        supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, "group"')
          .eq('email', session.user.email)
          .single()
          .then(({ data: profile, error }) => {
            if (!error && profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                cssbattle_profile_link: profile.cssbattle_profile_link,
                email_confirmed_at: session.user.email_confirmed_at,
                group: profile.group
              });
            }
          });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          return { success: false, error: "Please verify your email before logging in.", emailVerified: false };
        }

        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, "group"')
          .eq('email', data.user.email)
          .single();
        
        if (!profileError && profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: data.user.email_confirmed_at,
            group: profile.group
          });
        }
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (userData: { fullName: string; email: string; cssbattleProfileLink?: string; password: string; group: string }) => {
    try {
      // First, sign up the user with email verification enabled
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Insert user data into players table
        const { error: insertError } = await supabase
          .from('players')
          .insert([
            {
              full_name: userData.fullName,
              email: userData.email,
              cssbattle_profile_link: userData.cssbattleProfileLink || null,
              group: userData.group
            }
          ]);

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        // Email verification is required
        return { success: true, requiresEmailVerification: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const checkEmailVerification = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { isVerified: !!session.user.email_confirmed_at };
    }
    return { isVerified: false };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, checkEmailVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};