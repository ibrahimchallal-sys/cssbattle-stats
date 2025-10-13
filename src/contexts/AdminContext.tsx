import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  email: string;
  loggedInAt: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  login: (email: string) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Check for existing admin session on mount
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        setAdmin(session);
      } catch (error) {
        // Invalid session, remove it
        localStorage.removeItem("adminSession");
      }
    }
  }, []);

  const login = (email: string) => {
    const adminSession = {
      email,
      loggedInAt: new Date().toISOString()
    };
    
    localStorage.setItem("adminSession", JSON.stringify(adminSession));
    setAdmin(adminSession);
  };

  const logout = () => {
    localStorage.removeItem("adminSession");
    setAdmin(null);
  };

  const isAdmin = !!admin;

  return (
    <AdminContext.Provider value={{ admin, login, logout, isAdmin }}>
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
