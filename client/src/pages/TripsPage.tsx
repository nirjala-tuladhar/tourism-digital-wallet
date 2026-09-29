import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Plus, Search } from "lucide-react";
import { TripDetailPanel } from "../components/trips/TripDetailPanel";
import { TripListItem } from "../components/trips/TripListItem";
import { EmptyState } from "../components/ui/EmptyState";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { useTrip, useTrips } from "../hooks/useTrips";
import { ApiClientError } from "../api/client";

export function TripsPage() {
  const { data: trips, isLoading, isError, error, refetch } = useTrips();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const selectedId = searchParams.get("trip");

  const filtered = useMemo(() => {
    const list = trips ?? [];
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return list;
    }

    return list.filter((trip) =>
      [trip.name, trip.origin, trip.destination, trip.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [trips, query]);

  const activeTrips = filtered.filter((trip) => trip.status === "active");
  const inactiveTrips = filtered.filter((trip) => trip.status === "inactive");

  useEffect(() => {
    if (!trips || trips.length === 0 || selectedId) {
      return;
    }

    // Desktop convenience: preselect first active trip when nothing is selected.
    const prefersDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (!prefersDesktop) {
      return;
    }

    const first =
      trips.find((trip) => trip.status === "active") ?? trips[0] ?? null;

    if (first) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("trip", first.id);
          return next;
        },
        { replace: true },
      );
    }
  }, [trips, selectedId, setSearchParams]);

  const selectedTripFromList = trips?.find((trip) => trip.id === selectedId);
  const {
    data: selectedTripDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
  } = useTrip(selectedId ?? undefined);

  const selectedTrip = selectedTripDetail ?? selectedTripFromList;

  const selectTrip = (tripId: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("trip", tripId);
      return next;
    });
  };

  const clearSelection = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("trip");
      return next;
    });
  };

  const setQuery = (value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) {
        next.set("q", value);
      } else {
        next.delete("q");
      }
      return next;
    });
  };

  const listPane = (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Trips</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a trip to manage items and important dates.
          </p>
        </div>

        <Link
          to="/trips/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Trip
        </Link>
      </div>

      <label className="relative block">
        <span className="sr-only">Search trips</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trips..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </label>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      {isError ? (
        <div className="space-y-3">
          <FeedbackBanner
            tone="error"
            message={
              error instanceof ApiClientError
                ? error.message
                : "Unable to load trips."
            }
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && (trips?.length ?? 0) === 0 ? (
        <EmptyState
          title="No trips yet"
          description="Your travel plans will appear here once you create your first trip."
          action={
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Your First Trip
            </Link>
          }
        />
      ) : null}

      {!isLoading &&
      !isError &&
      (trips?.length ?? 0) > 0 &&
      filtered.length === 0 ? (
        <EmptyState
          title="No matching trips"
          description="Try a different search term, or clear the search to see all trips."
        />
      ) : null}

      {activeTrips.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active
          </h3>
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <TripListItem
                key={trip.id}
                trip={trip}
                selected={trip.id === selectedId}
                onSelect={selectTrip}
              />
            ))}
          </div>
        </section>
      ) : null}

      {inactiveTrips.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Inactive
          </h3>
          <div className="space-y-3">
            {inactiveTrips.map((trip) => (
              <TripListItem
                key={trip.id}
                trip={trip}
                selected={trip.id === selectedId}
                onSelect={selectTrip}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  const detailPane = (
    <div className="min-h-[28rem]">
      {!selectedId ? (
        <div className="flex h-full min-h-[28rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white px-6 text-center shadow-inner">
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            Select a trip
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-600">
            Choose a trip from the list to view travel items, important dates,
            and actions.
          </p>
        </div>
      ) : detailLoading && !selectedTrip ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      ) : detailError || !selectedTrip ? (
        <FeedbackBanner
          tone="error"
          message={
            detailErr instanceof ApiClientError
              ? detailErr.message
              : "Trip not found."
          }
        />
      ) : (
        <TripDetailPanel
          trip={selectedTrip}
          showBackButton
          onBack={clearSelection}
          onDeleted={clearSelection}
        />
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className={`${selectedId ? "hidden lg:block" : "block"}`}>
        {listPane}
      </div>

      <div className={`${selectedId ? "block" : "hidden lg:block"}`}>
        {detailPane}
      </div>
    </div>
  );
}
