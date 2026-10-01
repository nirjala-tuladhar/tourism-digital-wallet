import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { Trip } from "../../api/trips.api";
import { ApiClientError } from "../../api/client";
import { formatTripRange } from "../../lib/date";
import { useDeleteTrip, useUpdateTrip } from "../../hooks/useTrips";
import { ImportantDatesSection } from "./ImportantDatesSection";
import { TravelItemsSection } from "./TravelItemsSection";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { useToast } from "../ui/ToastProvider";

type TripDetailPanelProps = {
  trip: Trip;
  onDeleted?: () => void;
  focusItemId?: string | null;
  onFocusCleared?: () => void;
};

export function TripDetailPanel({
  trip,
  onDeleted,
  focusItemId,
  onFocusCleared,
}: TripDetailPanelProps) {
  const navigate = useNavigate();
  const updateTrip = useUpdateTrip(trip.id);
  const deleteTrip = useDeleteTrip();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pushToast = useToast();

  const archiveTrip = async () => {
    setActionError(null);
    try {
      await updateTrip.mutateAsync({
        status: trip.status === "active" ? "inactive" : "active",
      });
      pushToast(
        trip.status === "active" ? "Trip marked inactive." : "Trip marked active.",
      );
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to update trip status.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-teal-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Selected trip
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {trip.origin} → {trip.destination}
            </h2>
            <p className="mt-1 text-base text-slate-600">{trip.name}</p>
            <p className="mt-2 text-sm text-slate-500">
              {formatTripRange(trip.startDate, trip.endDate)}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                trip.status === "active"
                  ? "bg-brand/10 text-brand-dark"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {trip.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/trips/${trip.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Pencil className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
              Edit
            </Link>
            <button
              type="button"
              onClick={archiveTrip}
              disabled={updateTrip.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
            >
              {trip.status === "active" ? (
                <Archive className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              )}
              {trip.status === "active" ? "Mark inactive" : "Mark active"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>

        {trip.description ? (
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
            {trip.description}
          </p>
        ) : null}

        {actionError ? (
          <div className="mt-4">
            <FeedbackBanner tone="error" message={actionError} />
          </div>
        ) : null}
      </div>

      <TravelItemsSection
        tripId={trip.id}
        focusItemId={focusItemId}
        onFocusCleared={onFocusCleared}
      />
      <ImportantDatesSection tripId={trip.id} />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this trip permanently?"
        description="This removes the trip and all of its travel items and important dates. Prefer Archive if you only want to deactivate it."
        confirmLabel="Delete Trip"
        destructive
        busy={deleteTrip.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await deleteTrip.mutateAsync(trip.id);
            setConfirmDelete(false);
            pushToast("Trip deleted.");
            onDeleted?.();
            navigate("/trips", { replace: true });
          } catch (err) {
            setConfirmDelete(false);
            setActionError(
              err instanceof ApiClientError
                ? err.message
                : "Unable to delete trip.",
            );
          }
        }}
      />
    </div>
  );
}
