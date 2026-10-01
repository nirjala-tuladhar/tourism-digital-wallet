import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TripForm, type TripFormValues } from "../components/trips/TripForm";
import { ApiClientError } from "../api/client";
import { useCreateTrip } from "../hooks/useTrips";
import { useToast } from "../components/ui/ToastProvider";

export function CreateTripPage() {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();
  const pushToast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (values: TripFormValues) => {
    setServerError(null);

    try {
      const trip = await createTrip.mutateAsync({
        ...values,
        description: values.description?.trim() || undefined,
      });
      navigate(`/trips?trip=${trip.id}`, { replace: true });
      pushToast("Trip created successfully.");
    } catch (error) {
      setServerError(
        error instanceof ApiClientError
          ? error.message
          : "Unable to create trip. Please try again.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Create a new trip
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add the core details for your journey. You can attach travel items and
          important dates next.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <TripForm
          submitLabel="Create Trip"
          submittingLabel="Creating..."
          serverError={serverError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
