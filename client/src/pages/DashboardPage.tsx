import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MapPinned,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { ApiClientError } from "../api/client";
import { useDashboard } from "../hooks/useDashboard";
import { formatTripDate, formatTripRange } from "../lib/date";
import { getCategoryMeta } from "../lib/travelCategories";
import { WalletSearch } from "../components/search/WalletSearch";
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
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
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
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const hasAnyContent =
    data.stats.activeTrips > 0 ||
    data.stats.travelItems > 0 ||
    data.upcomingDates.length > 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-[#0f4c5c] via-[#146878] to-[#1a8a7a] p-6 text-white shadow-lg sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-teal-200/20 blur-2xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-teal-50 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Tourism Digital Wallet
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {greetingForNow()}
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-50/85 sm:text-base">
              Your trips, dates, and travel essentials — organized in one calm
              place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Trip
            </Link>
            <Link
              to="/trips"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Open Trips
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <WalletSearch />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active Trips",
            value: data.stats.activeTrips,
            icon: MapPinned,
            tone: "from-teal-50 to-white",
          },
          {
            label: "Upcoming Trips",
            value: data.stats.upcomingTrips,
            icon: CalendarDays,
            tone: "from-sky-50 to-white",
          },
          {
            label: "Travel Items",
            value: data.stats.travelItems,
            icon: Package,
            tone: "from-cyan-50 to-white",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className={`rounded-3xl border border-slate-200/80 bg-gradient-to-br ${stat.tone} p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-2.5 text-teal-700 shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!hasAnyContent ? (
        <EmptyState
          title="Your wallet is ready"
          description="Create your first trip to start organizing flights, hotels, visas, and key dates."
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

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">
              Upcoming Trips
            </h3>
            <Link
              to="/trips"
              className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
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
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-slate-900">
                      {trip.origin} → {trip.destination}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatTripRange(trip.startDate, trip.endDate)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
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
            <h3 className="text-lg font-semibold text-slate-900">
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
            <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
          <div className="grid gap-3">
            <Link
              to="/trips/new"
              className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm font-medium text-teal-900 transition hover:bg-teal-50"
            >
              Plan a new trip
            </Link>
            <Link
              to="/trips"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            >
              Browse all trips
            </Link>
          </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Upcoming Important Dates
          </h3>
          {data.upcomingDates.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming dates.</p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingDates.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3 transition hover:border-teal-200"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {formatTripDate(entry.date)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{entry.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{entry.type}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">
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
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
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
    </div>
  );
}
