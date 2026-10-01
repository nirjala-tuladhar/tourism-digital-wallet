import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { ApiClientError } from "../../api/client";
import {
  TRAVEL_ITEM_CATEGORIES,
  type TravelItemCategory,
} from "../../api/travelItems.api";
import type {
  SearchExpiryFilter,
  SearchTripStatus,
} from "../../api/search.api";
import { useWalletSearch } from "../../hooks/useSearch";
import { formatExpiry } from "../../lib/expiry";
import { getCategoryMeta } from "../../lib/travelCategories";

const STATUS_OPTIONS: Array<{ value: SearchTripStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EXPIRY_OPTIONS: Array<{ value: SearchExpiryFilter; label: string }> = [
  { value: "all", label: "Any expiry" },
  { value: "none", label: "No expiry" },
  { value: "soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
];

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function WalletSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tripStatus, setTripStatus] = useState<SearchTripStatus>("all");
  const [category, setCategory] = useState<TravelItemCategory | "">("");
  const [expiry, setExpiry] = useState<SearchExpiryFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);

  const filtersNarrowed =
    tripStatus !== "all" ||
    Boolean(category) ||
    expiry !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);
  const canSearch = debouncedQuery.trim().length >= 2 || filtersNarrowed;

  const search = useWalletSearch(
    {
      q: debouncedQuery.trim(),
      tripStatus,
      category,
      expiry,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    canSearch,
  );

  const openResult = (tripId: string, travelItemId?: string) => {
    const params = new URLSearchParams({ trip: tripId });

    if (travelItemId) {
      params.set("item", travelItemId);
    }

    navigate(`/trips?${params.toString()}`);
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Search className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">Search and filter</h3>
          <p className="text-sm text-slate-500">
            Find trips and travel items together. Active trips stay at the top.
          </p>
        </div>
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">Search trips and travel items</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder="Try Nepal hotel, visa, Qatar Airways..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        Filters
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => {
          const selected = tripStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setTripStatus(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? "bg-brand text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}

        <select
          aria-label="Travel item type"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as TravelItemCategory | "")
          }
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          <option value="">All types</option>
          {TRAVEL_ITEM_CATEGORIES.map((itemCategory) => (
            <option key={itemCategory} value={itemCategory}>
              {itemCategory}
            </option>
          ))}
        </select>

        <select
          aria-label="Expiry"
          value={expiry}
          onChange={(event) => setExpiry(event.target.value as SearchExpiryFilter)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {EXPIRY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Expiry from
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Expiry to
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
        </label>
      </div>

      <div className="mt-4" aria-live="polite">
        {query.trim().length === 1 && !filtersNarrowed ? (
          <p className="text-sm text-slate-500">Type at least 2 characters.</p>
        ) : null}

        {!canSearch ? (
          <p className="text-sm text-slate-500">
            Search across trip names, places, and travel items such as hotels,
            flights, and visas.
          </p>
        ) : null}

        {canSearch && search.isFetching ? (
          <p className="inline-flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching
          </p>
        ) : null}

        {search.isError ? (
          <div className="space-y-2">
            <p className="text-sm text-rose-700">
              {search.error instanceof ApiClientError
                ? search.error.message
                : "Search failed."}
            </p>
            <button
              type="button"
              onClick={() => search.refetch()}
              className="text-sm font-medium text-brand hover:underline"
            >
              Try again
            </button>
          </div>
        ) : null}

        {canSearch && search.data && !search.isFetching && search.data.count === 0 ? (
          <p className="text-sm text-slate-500">
            No results
            {debouncedQuery.trim() ? ` for “${debouncedQuery.trim()}”` : ""}.
          </p>
        ) : null}

        {search.data && search.data.count > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {search.data.count} result{search.data.count === 1 ? "" : "s"}
            </p>
            <ul className="space-y-2">
              {search.data.results.map((result) => {
                const meta = getCategoryMeta(result.category ?? "Other");
                const Icon = result.kind === "trip" ? Search : meta.icon;
                const expiryText = formatExpiry(
                  result.expiryStatus,
                  result.daysUntilExpiry,
                );

                return (
                  <li key={`${result.kind}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => openResult(result.tripId, result.travelItemId)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <div className={`rounded-xl p-2 ${meta.soft} ${meta.accent}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {result.title}
                        </p>
                        {result.subtitle ? (
                          <p className="truncate text-sm text-slate-600">
                            {result.subtitle}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-slate-500">{result.tripLabel}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              result.tripStatus === "active"
                                ? "bg-brand/10 text-brand-dark"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {result.tripStatus === "active"
                              ? "Active Trip"
                              : "Inactive Trip"}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                            {result.matchedOn === "trip" ? "Trip" : "Travel item"}
                          </span>
                          {expiryText ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              {expiryText}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
