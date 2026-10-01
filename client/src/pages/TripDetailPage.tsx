import { Navigate, useParams } from "react-router-dom";

/** Deep links like /trips/:id open the master/detail trips page with selection. */
export function TripDetailPage() {
  const { tripId } = useParams();

  if (!tripId) {
    return <Navigate to="/trips" replace />;
  }

  return <Navigate to={`/trips?trip=${encodeURIComponent(tripId)}`} replace />;
}
