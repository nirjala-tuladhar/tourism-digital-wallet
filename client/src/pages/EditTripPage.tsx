import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TripForm, type TripFormValues } from "../components/trips/TripForm";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { ApiClientError } from "../api/client";
import { useTrip, useUpdateTrip } from "../hooks/useTrips";

export function EditTripPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading, isError, error } = useTrip(tripId);
  const updateTrip = useUpdateTrip(tripId ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: TripFormValues) => {
    if (!tripId) return;

    setServerError(null);

    try {
      await updateTrip.mutateAsync({
        ...values,
        description: values.description?.trim() || undefined,
      });
      navigate(`/trips?trip=${tripId}`, { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiClientError
          ? error.message
          : "Unable to update trip. Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="space-y-3">
        <FeedbackBanner
          tone="error"
          message={
            error instanceof ApiClientError
              ? error.message
              : "Trip not found."
          }
        />
        <Link to="/trips" className="text-sm font-medium text-teal-700 hover:underline">
          Back to Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={`/trips?trip=${trip.id}`}
          className="text-sm font-medium text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          ← Back to Trip
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">Edit trip</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update destinations, dates, or notes for this trip.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <TripForm
          initialTrip={trip}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          serverError={serverError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
