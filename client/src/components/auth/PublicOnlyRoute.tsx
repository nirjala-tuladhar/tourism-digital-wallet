import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

export function PublicOnlyRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
