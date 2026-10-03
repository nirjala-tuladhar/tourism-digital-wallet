import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  ListChecks,
  MapPinned,
  Package,
  Plus,
  Receipt,
  Search,
  Sparkles,
} from "lucide-react";
import { planningApi } from "../api/planning.api";
import { EmptyState } from "../components/ui/EmptyState";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { ApiClientError } from "../api/client";
import { useDashboard } from "../hooks/useDashboard";
import { formatTripDate, formatTripRange } from "../lib/date";
import { queryKeys } from "../lib/queryKeys";
import { getCategoryMeta } from "../lib/travelCategories";
import { useAppSelector } from "../store/hooks";

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3">
        <FeedbackBanner
          tone="error"
          message={
            error instanceof ApiClientError
              ? error.message
              : "Unable to load dashboard."
          }
        />
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-medium text-brand hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const hasAnyContent = data.stats.totalTrips > 0 || data.stats.travelItems > 0;

  const stats = [
    {
      label: "Total Trips",
      value: data.stats.totalTrips,
      hint: "Your saved journeys",
      icon: MapPinned,
      iconClass: "bg-emerald-100 text-emerald-700",
      to: "/trips",
    },
    {
      label: "Active Trips",
      value: data.stats.activeTrips,
      hint: "Currently in your wallet",
      icon: Sparkles,
      iconClass: "bg-sky-100 text-sky-700",
      to: "/trips",
    },
    {
      label: "Upcoming",
      value: data.stats.upcomingTrips,
      hint: "Trips still ahead",
      icon: CalendarDays,
      iconClass: "bg-sky-100 text-sky-700",
      to: "/trips",
    },
    {
      label: "Completed",
      value: data.stats.completedTrips ?? 0,
      hint: "Finished journeys",
      icon: Sparkles,
      iconClass: "bg-teal-100 text-teal-800",
      to: "/trips",
    },
    {
      label: "Documents",
      value: data.stats.documents,
      hint: "Stored travel documents",
      icon: FileText,
      iconClass: "bg-amber-100 text-amber-700",
      to: "/search",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#062a33] p-6 text-white shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(45,212,191,0.22),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(14,116,144,0.35),_transparent_50%)]"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greetingForNow()}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
              Keep your travel plans, documents, and checklist organized in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Trip
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View Trips
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <span className={`rounded-xl p-2 ${stat.iconClass}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            </Link>
          );
        })}
      </section>

      <OpenChecklist
        items={data.openChecklist ?? []}
        completed={data.stats.checklistCompleted ?? 0}
        total={data.stats.checklistTotal ?? 0}
      />

      {!hasAnyContent ? (
        <EmptyState
          title="Your wallet is ready"
          description="Create your first trip to start organizing flights, hotels, visas, and key dates."
          action={
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Your First Trip
            </Link>
          }
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MapPinned className="h-4 w-4" aria-hidden="true" />
              </span>
              Upcoming Trips
            </h3>
            <Link
              to="/trips"
              className="text-sm font-medium text-brand transition hover:text-brand-dark"
            >
              View all
            </Link>
          </div>

          {data.upcomingTrips.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming active trips.</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips?trip=${trip.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-slate-900">
                      {trip.origin} → {trip.destination}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatTripRange(trip.startDate, trip.endDate)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    View
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              Upcoming Expirations
            </h3>
            {data.upcomingExpirations.length === 0 ? (
              <div>
                <p className="text-sm font-medium text-slate-800">You&apos;re all clear</p>
                <p className="mt-1 text-sm text-slate-500">
                  No travel documents are expiring soon.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.upcomingExpirations.map((entry) => {
                  const meta = getCategoryMeta(entry.category);
                  const Icon = meta.icon;
                  const dayLabel =
                    entry.daysUntilExpiry === 0
                      ? "Expires today"
                      : entry.daysUntilExpiry === 1
                        ? "Expires in 1 day"
                        : `Expires in ${entry.daysUntilExpiry} days`;

                  return (
                    <li key={entry.travelItemId}>
                      <Link
                        to={`/trips?trip=${entry.tripId}&item=${entry.travelItemId}`}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-amber-50/40 px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                      >
                        <div className={`rounded-xl p-2 ${meta.soft} ${meta.accent}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {entry.title}
                          </p>
                          <p className="text-xs text-amber-800">{dayLabel}</p>
                          <p className="truncate text-xs text-slate-500">
                            {entry.tripLabel}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                <Search className="h-4 w-4" aria-hidden="true" />
              </span>
              Quick actions
            </h3>
          <div className="grid gap-3">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Search className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Search and filter
            </Link>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Create trip
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Package className="h-4 w-4 text-sky-600" aria-hidden="true" />
              Add travel item
            </Link>
            <Link
              to="/expenses"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Receipt className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Add expense
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ListChecks className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Add checklist item
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <MapPinned className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              View trips
            </Link>
          </div>
          </div>
        </div>
      </section>

      <section>
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            Recent Travel Items
          </h3>
          {data.recentItems.length === 0 ? (
            <p className="text-sm text-slate-500">No travel items yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentItems.map((item) => {
                const meta = getCategoryMeta(item.category);
                const Icon = meta.icon;

                return (
                  <li key={item.id}>
                    <Link
                      to={`/trips?trip=${item.tripId}&item=${item.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md"
                    >
                      <div className={`rounded-xl p-2 ${meta.soft} ${meta.accent}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500">{meta.label}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Important items</h3>
          {(data.importantItems ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Star a travel item to keep it here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(data.importantItems ?? []).map((item) => (
                <li key={item.id}>
                  <Link to={`/trips?trip=${item.tripId}&item=${item.id}`} className="block rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:border-brand/30">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent expenses</h3>
          {(data.recentExpenses ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Expenses from your trips will show up here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(data.recentExpenses ?? []).map((expense) => (
                <li key={expense.id}>
                  <Link to={`/expenses/${expense.tripId}`} className="block rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-brand/30">
                    <span className="font-medium text-slate-900">{expense.currency} {expense.amount.toFixed(2)}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{expense.category} · {expense.tripLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Upcoming itinerary</h3>
          {(data.upcomingItinerary ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Add plans inside a trip to see them here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(data.upcomingItinerary ?? []).map((entry) => (
                <li key={entry.id}>
                  <Link to={`/trips?trip=${entry.tripId}`} className="block rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-brand/30">
                    <span className="font-medium text-slate-900">{entry.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {formatTripDate(entry.date)}{entry.time ? ` · ${entry.time}` : ""} · {entry.tripLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function OpenChecklist({
  items,
  completed,
  total,
}: {
  items: Array<{ id: string; tripId: string; title: string; tripLabel: string }>;
  completed: number;
  total: number;
}) {
  const token = useAppSelector((state) => state.auth.token);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const toggle = useMutation({
    mutationFn: (item: { id: string; tripId: string }) => {
      if (!token) {
        throw new Error("Authentication required");
      }

      return planningApi.updateChecklist(item.tripId, item.id, { completed: true }, token);
    },
    onSuccess: async (_data, item) => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.checklist(item.tripId) }),
      ]);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "Unable to update checklist.");
    },
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
          </span>
          Checklist
        </h3>
        <p className="text-sm text-slate-500">
          {completed} of {total} completed
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: total ? `${(completed / total) * 100}%` : "0%" }}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          {total === 0 ? "Add a checklist item from a trip." : "Everything on your checklist is done."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-2">
              <button
                type="button"
                aria-label={`Mark ${item.title} complete`}
                disabled={toggle.isPending}
                onClick={() => toggle.mutate(item)}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 text-transparent hover:border-brand hover:text-brand"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                <p className="truncate text-xs text-slate-500">{item.tripLabel}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
