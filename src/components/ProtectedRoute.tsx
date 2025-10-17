import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setChecking(false);
      if (!user) {
        navigate('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (checking) {
    return null;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;