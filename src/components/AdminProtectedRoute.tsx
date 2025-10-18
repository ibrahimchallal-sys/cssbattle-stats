import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChecking(false);
      if (!loading && !isAdmin) {
        navigate("/admin");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isAdmin, loading, navigate]);

  if (checking || loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAdmin) return null;

  return <>{children}</>;
};

export default AdminProtectedRoute;
