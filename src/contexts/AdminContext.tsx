import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

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
        const hardcodedAdmin = localStorage.getItem('hardcoded_admin');
        
        if (hardcodedAdmin) {
          const adminData = JSON.parse(hardcodedAdmin);
          if (mounted) {
            setAdmin(adminData as User);
            setIsAdmin(true);
            setLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          // Check if user has admin role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .single();

          if (roleData) {
            setAdmin(session.user);
            setIsAdmin(true);
          } else {
            setAdmin(null);
            setIsAdmin(false);
          }
        } else if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    // Listen for auth changes - but don't interfere with regular user auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Check for hardcoded admin first
      const hardcodedAdmin = localStorage.getItem('hardcoded_admin');
      if (hardcodedAdmin) {
        return; // Don't process regular auth if hardcoded admin exists
      }

      if (session?.user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single();

        if (roleData && mounted) {
          setAdmin(session.user);
          setIsAdmin(true);
        } else if (mounted) {
          setAdmin(null);
          setIsAdmin(false);
        }
      } else if (mounted) {
        setAdmin(null);
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    localStorage.removeItem('hardcoded_admin');
    await supabase.auth.signOut();
    setAdmin(null);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ admin, isAdmin, loading, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};