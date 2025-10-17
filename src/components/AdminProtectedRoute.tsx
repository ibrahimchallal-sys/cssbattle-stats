import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChecking(false);
      if (!loading && !isAdmin) {
        navigate('/admin');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAdmin, loading, navigate]);

  if (checking || loading) return null;
  if (!isAdmin) return null;

  return <>{children}</>;
};

export default AdminProtectedRoute;
