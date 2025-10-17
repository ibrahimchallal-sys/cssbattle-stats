import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import LoadingSpinner from "@/components/LoadingSpinner";
import { safeLocalStorage } from "@/lib/storage";

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
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  register: (userData: {
    fullName: string;
    email: string;
    cssLink?: string;
    password: string;
    group: string;
    phone?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    requiresEmailVerification?: boolean;
  }>;
  checkEmailVerification: () => Promise<{ isVerified: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = async (session: Session) => {
    try {
      const { data: profile, error } = await supabase
        .from("players")
        .select(
          "id, full_name, email, cssbattle_profile_link, group_name, phone"
        )
        .eq("email", session.user.email)
        .maybeSingle();

      if (!error && profile) {
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          cssbattle_profile_link: profile.cssbattle_profile_link || undefined,
          email_confirmed_at: session.user.email_confirmed_at,
          group_name: profile.group_name || undefined,
          phone: profile.phone || undefined,
        };
      } else {
        return {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.email!,
          email_confirmed_at: session.user.email_confirmed_at,
        };
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.email!,
        email_confirmed_at: session.user.email_confirmed_at,
      };
    }
  };

  // Initialize auth state
  const initializeAuth = async () => {
    if (initialized) return;

    try {
      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const userProfile = await fetchUserProfile(session);
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        fetchUserProfile(session).then((userProfile) => {
          if (mounted) {
            setUser(userProfile);
          }
        });
      } else {
        if (mounted) {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          return {
            success: false,
            error: "Please verify your email before logging in.",
            emailVerified: false,
          };
        }

        const userProfile = await fetchUserProfile(data.session);
        setUser(userProfile);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      // Clear any stored auth data
      safeLocalStorage.removeItem("hardcoded_admin");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    cssLink?: string;
    password: string;
    group: string;
    phone?: string;
  }) => {
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
        const { error: insertError } = await supabase.from("players").insert([
          {
            id: data.user.id,
            full_name: userData.fullName,
            email: userData.email,
            cssbattle_profile_link: userData.cssLink || null,
            group_name: userData.group,
            phone: userData.phone || null,
            score: 0,
          },
        ]);

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        return { success: true, requiresEmailVerification: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const checkEmailVerification = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      return { isVerified: !!session.user.email_confirmed_at };
    }
    return { isVerified: false };
  };

  // Always render children, but show loading spinner during initialization
  if (loading) {
    return <LoadingSpinner message="Initializing..." />;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, register, checkEmailVerification }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
