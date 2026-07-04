import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { LoadingScreen } from "@/components/ui/Loading";

export function PublicRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? ROUTES.DASHBOARD : ROUTES.HOME} replace />;
  }

  return <Outlet />;
}