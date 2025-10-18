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
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        const hardcodedAdmin = safeLocalStorage.getItem("hardcoded_admin");

        if (hardcodedAdmin) {
          const adminData = JSON.parse(hardcodedAdmin);
          if (mounted) {
            setAdmin(adminData as User);
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        // For regular admin checking, we'll rely on the auth listener
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      mounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    safeLocalStorage.removeItem("hardcoded_admin");
    setAdmin(null);
    setIsAdmin(false);
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
