import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "../api/client";
import { clearCredentials } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";
import { MainLayout } from "../components/layout/MainLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { TripsPage } from "../pages/TripsPage";
import { CreateTripPage } from "../pages/CreateTripPage";
import { EditTripPage } from "../pages/EditTripPage";
import { ExpensesPage } from "../pages/ExpensesPage";
import { TripExpensesPage } from "../pages/TripExpensesPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SearchPage } from "../pages/SearchPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TripDetailPage } from "../pages/TripDetailPage";

function SessionGuard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(clearCredentials());
      navigate("/login", { replace: true, state: { reason: "expired" } });
    });

    return () => setUnauthorizedHandler(null);
  }, [dispatch, navigate]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <SessionGuard />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />

          <Route
            path="/trips"
            element={
              <MainLayout>
                <TripsPage />
              </MainLayout>
            }
          />

          <Route
            path="/trips/new"
            element={
              <MainLayout>
                <CreateTripPage />
              </MainLayout>
            }
          />

          <Route
            path="/trips/:tripId"
            element={
              <MainLayout>
                <TripDetailPage />
              </MainLayout>
            }
          />

          <Route
            path="/trips/:tripId/edit"
            element={
              <MainLayout>
                <EditTripPage />
              </MainLayout>
            }
          />

          <Route
            path="/profile"
            element={
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            }
          />

          <Route
            path="/expenses"
            element={
              <MainLayout>
                <ExpensesPage />
              </MainLayout>
            }
          />

          <Route
            path="/expenses/:tripId"
            element={
              <MainLayout>
                <TripExpensesPage />
              </MainLayout>
            }
          />

          <Route
            path="/search"
            element={
              <MainLayout>
                <SearchPage />
              </MainLayout>
            }
          />

          <Route
            path="/settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
