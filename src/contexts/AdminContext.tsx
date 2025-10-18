import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import LoadingSpinner from "@/components/LoadingSpinner";
import { safeLocalStorage } from "@/lib/storage";

interface AdminContextType {
  admin: User | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminContext useEffect running');
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");
        console.log('Checking admin status, hardcodedAdmin:', hardcodedAdmin);

        if (hardcodedAdmin) {
          const adminData = JSON.parse(hardcodedAdmin);
          console.log('Found admin data:', adminData);
          if (mounted) {
            setAdmin(adminData as User);
            setIsAdmin(true);
          }
        } else {
          console.log('No hardcoded admin found');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      } finally {
        // Always ensure loading is set to false
        console.log('Setting loading to false');
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for storage changes (including localStorage updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted) return;
      console.log('Storage event triggered:', e.key, e.newValue);
      if (e.key === "hardcoded_admin") {
        if (e.newValue) {
          try {
            const adminData = JSON.parse(e.newValue);
            console.log('Setting admin data from storage event:', adminData);
            if (mounted) {
              setAdmin(adminData as User);
              setIsAdmin(true);
            }
          } catch (error) {
            console.error("Error parsing hardcoded admin:", error);
            safeLocalStorage.removeItem("hardcoded_admin");
          }
        } else {
          // Admin logged out
          console.log('Admin logged out, clearing state');
          if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Supabase auth state change:', _event, session);
      if (!mounted) return;

      // Check for hardcoded admin first
      const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");
      if (hardcodedAdmin) {
        try {
          const adminData = JSON.parse(hardcodedAdmin);
          if (mounted) {
            setAdmin(adminData as User);
            setIsAdmin(true);
          }
          return;
        } catch (error) {
          console.error("Error parsing hardcoded admin:", error);
          safeLocalStorage.removeItem("hardcoded_admin");
        }
      }

      if (session?.user) {
        try {
          const { data: roleData, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!error && roleData && mounted) {
            setAdmin(session.user);
            setIsAdmin(true);
          } else if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
          if (mounted) {
            setAdmin(null);
            setIsAdmin(false);
          }
        }
      } else if (mounted) {
        setAdmin(null);
        setIsAdmin(false);
      }
    });

    return () => {
      console.log('AdminContext useEffect cleanup');
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array is correct here

  const logout = async () => {
    safeLocalStorage.removeItem("hardcoded_admin");
    setAdmin(null);
    setIsAdmin(false);
    
    // Also sign out from Supabase auth to ensure clean state
    await supabase.auth.signOut();
  };

  // Always render children, but show loading spinner during initialization
  if (loading) {
    return <LoadingSpinner message="Initializing admin..." />;
  }

  return (
    <AdminContext.Provider value={{ admin, isAdmin, loading, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};