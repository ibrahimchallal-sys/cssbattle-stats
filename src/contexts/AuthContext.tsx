import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  cssbattle_profile_link?: string;
  email_confirmed_at?: string;
  group_name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  register: (userData: { fullName: string; email: string; cssLink?: string; password: string; group: string; phone?: string }) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  checkEmailVerification: () => Promise<{ isVerified: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      if (session) {
        // Use setTimeout to avoid blocking the auth callback
        setTimeout(() => {
          if (!mounted) return;
          
          supabase
            .from('players')
            .select('id, full_name, email, cssbattle_profile_link, group_name, phone')
            .eq('email', session.user.email)
            .maybeSingle()
            .then(({ data: profile, error }) => {
              if (!mounted) return;
              
              if (!error && profile) {
                setUser({
                  id: profile.id,
                  email: profile.email,
                  full_name: profile.full_name,
                  cssbattle_profile_link: profile.cssbattle_profile_link || undefined,
                  email_confirmed_at: session.user.email_confirmed_at,
                  group_name: profile.group_name || undefined,
                  phone: profile.phone || undefined,
                });
              } else {
                setUser({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.email!,
                  email_confirmed_at: session.user.email_confirmed_at
                });
              }
            });
        }, 0);
      } else {
        setUser(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (session) {
        supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, group_name, phone')
          .eq('email', session.user.email)
          .maybeSingle()
          .then(({ data: profile, error }) => {
            if (!mounted) return;
            
            if (!error && profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                cssbattle_profile_link: profile.cssbattle_profile_link || undefined,
                email_confirmed_at: session.user.email_confirmed_at,
                group_name: profile.group_name || undefined,
                phone: profile.phone || undefined,
              });
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.email!,
                email_confirmed_at: session.user.email_confirmed_at
              });
            }
          });
      }
    });

    return () => {
      mounted = false;
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
        if (!data.user.email_confirmed_at) {
          return { success: false, error: "Please verify your email before logging in.", emailVerified: false };
        }

        const { data: profile, error: profileError } = await supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, group_name, phone')
          .eq('email', data.user.email)
          .maybeSingle();
        
        if (!profileError && profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link || undefined,
            email_confirmed_at: data.user.email_confirmed_at,
            group_name: profile.group_name || undefined,
            phone: profile.phone || undefined,
          });
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.email!,
            email_confirmed_at: data.user.email_confirmed_at
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

  const register = async (userData: { fullName: string; email: string; cssLink?: string; password: string; group: string; phone?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { error: insertError } = await supabase
          .from('players')
          .insert([
            {
              id: data.user.id,
              full_name: userData.fullName,
              email: userData.email,
              cssbattle_profile_link: userData.cssLink || null,
              group_name: userData.group,
              phone: userData.phone || null,
              score: 0
            }
          ]);
        
        if (insertError) {
          return { success: false, error: insertError.message };
        }

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
