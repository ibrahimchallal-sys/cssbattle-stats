import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string;
  cssbattle_profile_link?: string;
  email_confirmed_at?: string;
  group?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  register: (userData: { fullName: string; email: string; cssbattleProfileLink?: string; password: string; group: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  checkEmailVerification: () => Promise<{ isVerified: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      console.log("AuthContext - Checking session...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("AuthContext - Session data:", session);
      if (session) {
        console.log("AuthContext - Session exists, fetching user profile for email:", session.user.email);
        
        // First, let's check what's in the players table
        const { data: allPlayers, error: allPlayersError } = await supabase
          .from('players')
          .select('*');
        
        console.log("AuthContext - All players in table:", allPlayers);
        console.log("AuthContext - All players error:", allPlayersError);
        
        // Get user profile data
        const { data: profile, error } = await supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, group, phone_number')
          .eq('email', session.user.email)
          .single();
        
        console.log("AuthContext - Profile data:", profile);
        console.log("AuthContext - Profile error:", error);
        
        if (error) {
          console.error("Error fetching user profile:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        }
        
        if (!error && profile) {
          console.log("AuthContext - Setting user data:", {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: session.user.email_confirmed_at,
            group: profile.group,
            phone_number: profile.phone_number
          });
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: session.user.email_confirmed_at,
            group: profile.group,
            phone_number: profile.phone_number
          });
        } else if (!error) {
          console.log("AuthContext - No profile found or error occurred");
          // Even if we can't find the profile, we should still set the user with basic auth data
          if (!error) {
            console.log("AuthContext - Setting basic user data from session");
            setUser({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.email, // Use email as fallback
              email_confirmed_at: session.user.email_confirmed_at
            } as User);
          }
        } else {
          console.log("AuthContext - Error occurred, setting basic user data");
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.email, // Use email as fallback
            email_confirmed_at: session.user.email_confirmed_at
          } as User);
        }
      } else {
        console.log("AuthContext - No session found");
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AuthContext - Auth state changed:", _event, session);
      if (session) {
        console.log("AuthContext - Session exists in auth change, fetching user profile for email:", session.user.email);
        
        // Get user profile data
        (async () => {
          try {
            // First, let's check what's in the players table
            const { data: allPlayers, error: allPlayersError } = await supabase
              .from('players')
              .select('*');
            
            console.log("AuthContext - All players in table:", allPlayers);
            console.log("AuthContext - All players error:", allPlayersError);
            
            const { data: profile, error } = await supabase
              .from('players')
              .select('id, full_name, email, cssbattle_profile_link, group, phone_number')
              .eq('email', session.user.email)
              .single();
            
            console.log("AuthContext - Profile data from auth change:", profile);
            console.log("AuthContext - Profile error from auth change:", error);
            
            if (error) {
              console.error("Error fetching user profile on auth change:", error);
              console.error("Error details:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
              });
            }
            
            if (!error && profile) {
              console.log("AuthContext - Setting user data from auth change:", {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                cssbattle_profile_link: profile.cssbattle_profile_link,
                email_confirmed_at: session.user.email_confirmed_at,
                group: profile.group,
                phone_number: profile.phone_number
              });
              setUser({
                id: profile.id, // This should be the same as session.user.id
                email: profile.email,
                full_name: profile.full_name,
                cssbattle_profile_link: profile.cssbattle_profile_link,
                email_confirmed_at: session.user.email_confirmed_at,
                group: profile.group,
                phone_number: profile.phone_number
              });
            } else if (!error) {
              console.log("AuthContext - No profile data found for user, setting basic user data");
              setUser({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.email, // Use email as fallback
                email_confirmed_at: session.user.email_confirmed_at
              } as User);
            } else {
              console.log("AuthContext - Error occurred, setting basic user data");
              setUser({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.email, // Use email as fallback
                email_confirmed_at: session.user.email_confirmed_at
              } as User);
            }
          } catch (err) {
            console.error("AuthContext - Unexpected error in profile fetch:", err);
            // Even on error, set basic user data
            console.log("AuthContext - Setting basic user data from session after error");
            setUser({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.email, // Use email as fallback
              email_confirmed_at: session.user.email_confirmed_at
            } as User);
          }
        })();
      } else {
        console.log("AuthContext - No session in auth change, clearing user");
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("AuthContext - Login attempt with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log("AuthContext - Login response:", data);
      console.log("AuthContext - Login error:", error);

      if (error) {
        console.log("AuthContext - Login failed with error:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("AuthContext - User authenticated:", data.user);
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          console.log("AuthContext - Email not verified");
          return { success: false, error: "Please verify your email before logging in.", emailVerified: false };
        }

        console.log("AuthContext - Email verified, fetching profile for email:", data.user.email);
        // First, let's check what's in the players table
        const { data: allPlayers, error: allPlayersError } = await supabase
          .from('players')
          .select('*');
        
        console.log("AuthContext - All players in table:", allPlayers);
        console.log("AuthContext - All players error:", allPlayersError);
        
        // Test insert permissions
        if (allPlayers && allPlayers.length > 0) {
          const testPlayer = allPlayers[0];
          console.log("AuthContext - Testing update permissions on player:", testPlayer.id);
          const { data: updateTest, error: updateError } = await supabase
            .from('players')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', testPlayer.id)
            .select();
          
          console.log("AuthContext - Update test result:", updateTest);
          console.log("AuthContext - Update test error:", updateError);
        }
        
        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('players')
          .select('id, full_name, email, cssbattle_profile_link, group, phone_number')
          .eq('email', data.user.email)
          .single();
        
        console.log("AuthContext - Profile data:", profile);
        console.log("AuthContext - Profile error:", profileError);
        
        if (profileError) {
          console.error("Profile fetch error:", profileError);
          console.error("Profile error details:", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          });
        }
        
        if (!profileError && profile) {
          console.log("AuthContext - Setting user data after login:", {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: data.user.email_confirmed_at,
            group: profile.group,
            phone_number: profile.phone_number
          });
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            cssbattle_profile_link: profile.cssbattle_profile_link,
            email_confirmed_at: data.user.email_confirmed_at,
            group: profile.group,
            phone_number: profile.phone_number
          });
        } else if (!profileError) {
          console.log("AuthContext - No profile found, setting basic user data");
          setUser({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.email, // Use email as fallback
            email_confirmed_at: data.user.email_confirmed_at
          } as User);
        } else {
          console.log("AuthContext - Profile error occurred");
          return { success: false, error: 'Failed to fetch user profile' };
        }
        
        return { success: true };
      }

      console.log("AuthContext - Login failed - no user data");
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error("AuthContext - Unexpected login error:", error);
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (userData: { fullName: string; email: string; cssbattleProfileLink?: string; password: string; group: string; phoneNumber?: string }) => {
    try {
      console.log("AuthContext - Register attempt with data:", userData);
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

      console.log("AuthContext - Register response:", data);
      console.log("AuthContext - Register error:", error);

      if (error) {
        console.log("AuthContext - Register failed with error:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("AuthContext - User registered in auth, inserting into players table...");
        // Insert user data into players table
        const { error: insertError } = await supabase
          .from('players')
          .insert([
            {
              full_name: userData.fullName,
              email: userData.email,
              cssbattle_profile_link: userData.cssbattleProfileLink || null,
              group: userData.group,
              phone_number: userData.phoneNumber || null,
              score: 0 // Add score field to satisfy NOT NULL constraint
            }
          ]);

        console.log("AuthContext - Insert into players table error:", insertError);
        
        if (insertError) {
          console.error("AuthContext - Insert error details:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint
          });
          return { success: false, error: insertError.message };
        }
        
        // Let's check if the user was actually inserted
        const { data: insertedUser, error: selectError } = await supabase
          .from('players')
          .select('*')
          .eq('email', userData.email)
          .single();
        
        console.log("AuthContext - Inserted user data:", insertedUser);
        console.log("AuthContext - Select error:", selectError);

        // Email verification is required
        return { success: true, requiresEmailVerification: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error("AuthContext - Unexpected register error:", error);
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