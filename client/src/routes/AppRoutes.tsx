import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { DashboardPage } from "../pages/DashboardPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>

      <p className="mt-2 text-gray-600">
        This section is under development.
      </p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
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
              <PlaceholderPage title="Trips" />
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
      </Routes>
    </BrowserRouter>
  );
}