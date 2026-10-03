import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt } from "lucide-react";
import { ApiClientError } from "../api/client";
import { planningApi, type ExpenseBoardTrip } from "../api/planning.api";
import { tripsApi } from "../api/trips.api";
import { CurrencySelect } from "../components/expenses/CurrencySelect";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { queryKeys } from "../lib/queryKeys";
import { formatMoney, formatSpent, remainingAfterExpenses, spentAgainstBudget } from "../lib/money";
import { useAppSelector } from "../store/hooks";

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

export function ExpensesPage() {
  const token = useAppSelector((state) => state.auth.token);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.expenseBoard,
    enabled: Boolean(token),
    queryFn: async () => (await planningApi.listExpenseBoard(token!)).data,
  });

  const trips = data ?? [];
  const activeTrips = trips.filter((trip) => trip.status === "active");
  const otherTrips = trips.filter((trip) => trip.status !== "active");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Receipt className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500">Budgets and spending for your trips. Active trips come first.</p>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-48 rounded-3xl" /> : null}

      {isError ? (
        <div className="space-y-3">
          <FeedbackBanner
            tone="error"
            message={error instanceof ApiClientError ? error.message : "Unable to load expenses."}
          />
          <button type="button" onClick={() => refetch()} className="text-sm font-medium text-brand hover:underline">
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="font-medium text-slate-900">No trips yet</p>
          <p className="mt-1 text-sm text-slate-500">Create a trip before adding expenses.</p>
          <Link to="/trips/new" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
            Create trip
          </Link>
        </div>
      ) : null}

      {!isLoading && !isError && trips.length > 0 ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active trips</h3>
            {activeTrips.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                No active trips. Mark a trip active to track its budget here.
              </p>
            ) : (
              <div className="grid gap-4">
                {activeTrips.map((trip) => (
                  <TripExpenseCard key={trip.id} trip={trip} emphasized />
                ))}
              </div>
            )}
          </section>

          {otherTrips.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Other trips</h3>
              <div className="grid gap-4">
                {otherTrips.map((trip) => (
                  <TripExpenseCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TripExpenseCard({ trip, emphasized = false }: { trip: ExpenseBoardTrip; emphasized?: boolean }) {
  const token = useAppSelector((state) => state.auth.token);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(trip.budgetAmount == null ? "" : String(trip.budgetAmount));
  const [currency, setCurrency] = useState(trip.budgetCurrency ?? "USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budgetCurrency = trip.budgetCurrency?.trim().toUpperCase() || null;
  const budgetAmount = trip.budgetAmount == null ? null : Number(trip.budgetAmount);
  const spentAmount = spentAgainstBudget(trip.spent, budgetCurrency);
  const budgetLabel =
    budgetAmount != null && budgetCurrency ? formatMoney(budgetAmount, budgetCurrency) : "Not set";
  const remaining =
    budgetAmount == null ? null : remainingAfterExpenses(budgetAmount, spentAmount);

  const saveBudget = async () => {
    if (!token) return;
    const trimmed = amount.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);

    if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
      setError("Enter a budget of 0 or more.");
      return;
    }

    if (parsed != null && currency.trim().length !== 3) {
      setError("Currency must be a 3-letter code.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await tripsApi.update(
        trip.id,
        parsed == null
          ? { budgetAmount: null, budgetCurrency: null }
          : { budgetAmount: parsed, budgetCurrency: currency.toUpperCase() },
        token,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenseBoard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(trip.id) }),
      ]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-sm ${
        emphasized ? "border-brand/30 ring-1 ring-brand/15" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{trip.status}</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
            {trip.origin} → {trip.destination}
          </h3>
          <p className="truncate text-sm text-slate-500">{trip.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/expenses/${trip.id}?add=1`}
            className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add expense
          </Link>
          <Link
            to={`/expenses/${trip.id}`}
            className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            View expenses
          </Link>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Budget</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{budgetLabel}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Spent</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{formatSpent(trip.spent)}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Remaining</dt>
          <dd className={`mt-1 text-sm font-semibold ${remaining != null && remaining < 0 ? "text-rose-700" : "text-slate-900"}`}>
            {remaining == null || !budgetCurrency ? "—" : formatMoney(remaining, budgetCurrency)}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Expenses</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{trip.expenseCount}</dd>
        </div>
      </dl>

      {budgetAmount != null ? (
        <p className="mt-2 text-xs text-slate-500">Remaining = budget − spent.</p>
      ) : null}

      <div className="mt-4">
        {open ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">
              Budget amount
              <input
                className={fieldClass}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-600">
              Currency
              <CurrencySelect className={fieldClass} value={currency} onChange={setCurrency} />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={saveBudget}
                disabled={saving}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
            {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-brand hover:underline">
            {trip.budgetAmount == null ? "Set budget" : "Edit budget"}
          </button>
        )}
      </div>
    </article>
  );
}
