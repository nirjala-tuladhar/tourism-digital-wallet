import type { Trip } from "../../api/trips.api";
import { formatTripRange } from "../../lib/date";

type TripListItemProps = {
  trip: Trip;
  selected?: boolean;
  onSelect: (tripId: string) => void;
};

export function TripListItem({ trip, selected = false, onSelect }: TripListItemProps) {
  const itemCount = trip.travelItemCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(trip.id)}
      aria-pressed={selected}
      className={`group w-full rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        selected
          ? "border-teal-400 bg-gradient-to-br from-[#0e7490]/10 to-white shadow-md ring-1 ring-[#0e7490]/25"
          : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-10 w-1 shrink-0 rounded-full transition ${
            selected ? "bg-brand" : "bg-slate-200 group-hover:bg-brand/40"
          }`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-slate-900">{trip.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                trip.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : trip.status === "upcoming"
                    ? "bg-sky-100 text-sky-800"
                    : trip.status === "completed"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {trip.status}
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-slate-600">
            {trip.origin} → {trip.destination}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {formatTripRange(trip.startDate, trip.endDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {itemCount === 1 ? "1 travel item" : `${itemCount} travel items`}
          </p>
        </div>
      </div>
    </button>
  );
}
