import { Link } from "react-router-dom";
import type { Trip } from "../../api/trips.api";
import { formatTripRange } from "../../lib/date";

type TripCardProps = {
  trip: Trip;
};

export function TripCard({ trip }: TripCardProps) {
  const itemCount = trip.travelItemCount ?? 0;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900">
            {trip.name}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-600">
            {trip.origin} → {trip.destination}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            trip.status === "active"
              ? "bg-teal-50 text-teal-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {trip.status === "active" ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {formatTripRange(trip.startDate, trip.endDate)}
      </p>

      <p className="mt-2 text-sm text-slate-600">
        {itemCount === 1 ? "1 travel item" : `${itemCount} travel items`}
      </p>

      <div className="mt-auto pt-5">
        <Link
          to={`/trips/${trip.id}`}
          className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          View Trip →
        </Link>
      </div>
    </article>
  );
}
