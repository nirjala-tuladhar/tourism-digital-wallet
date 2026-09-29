import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import { TripDetailPage } from "../pages/TripDetailPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-gray-600">This section is under development.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
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
            path="/documents"
            element={
              <MainLayout>
                <PlaceholderPage title="Documents" />
              </MainLayout>
            }
          />

          <Route
            path="/bookings"
            element={
              <MainLayout>
                <PlaceholderPage title="Bookings" />
              </MainLayout>
            }
          />

          <Route
            path="/itinerary"
            element={
              <MainLayout>
                <PlaceholderPage title="Itinerary" />
              </MainLayout>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
