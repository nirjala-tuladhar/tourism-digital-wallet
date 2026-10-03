import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpensePayload,
} from "../api/planning.api";
import { ApiClientError } from "../api/client";
import { CurrencySelect } from "../components/expenses/CurrencySelect";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import { useExpenseMutations, useExpenses } from "../hooks/useTripPlanning";
import { useTrip } from "../hooks/useTrips";
import { formatTripDate, todayDateInputValue, toDateInputValue } from "../lib/date";
import { formatMoney, formatSpent, groupSpent, remainingAfterExpenses, roundMoney, spentAgainstBudget } from "../lib/money";

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function blankExpense(currency: string): ExpensePayload {
  return {
    amount: 0,
    currency,
    category: "Food",
    date: todayDateInputValue(),
    description: "",
  };
}

export function TripExpensesPage() {
  const { tripId = "" } = useParams();
  const tripQuery = useTrip(tripId);
  const expensesQuery = useExpenses(tripId);
  const [editing, setEditing] = useState<Expense | null>(null);
  const trip = tripQuery.data;
  const expenses = [...(expensesQuery.data ?? [])].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime() || left.id.localeCompare(right.id),
  );

  if (tripQuery.isLoading || expensesQuery.isLoading) {
    return <Skeleton className="h-96 rounded-3xl" />;
  }

  if (tripQuery.isError || !trip) {
    return (
      <FeedbackBanner
        tone="error"
        message={
          tripQuery.error instanceof ApiClientError
            ? tripQuery.error.message
            : "Unable to open this trip's expenses."
        }
      />
    );
  }

  const budgetCurrency = trip.budgetCurrency?.trim().toUpperCase() || null;
  const budgetAmount = trip.budgetAmount == null ? null : Number(trip.budgetAmount);
  const spentGroups = groupSpent(expenses);
  const spentAmount = spentAgainstBudget(spentGroups, budgetCurrency);
  const remaining =
    budgetAmount == null ? null : remainingAfterExpenses(budgetAmount, spentAmount);

  return (
    <div className="space-y-4">
      <Link to="/expenses" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All expenses
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-dashed border-slate-300 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {trip.origin} → {trip.destination}
            </h2>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Budget</dt>
                <dd className="font-medium text-slate-900">
                  {budgetAmount != null && budgetCurrency ? formatMoney(budgetAmount, budgetCurrency) : "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Spent</dt>
                <dd className="text-right font-medium text-slate-900">{formatSpent(spentGroups)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Remaining</dt>
                <dd className={`font-semibold ${remaining != null && remaining < 0 ? "text-rose-700" : "text-slate-900"}`}>
                  {remaining == null || !budgetCurrency
                    ? "—"
                    : formatMoney(remaining, budgetCurrency)}
                </dd>
              </div>
            </dl>
            {budgetAmount != null && budgetCurrency ? (
              <p className="mt-3 text-xs text-slate-500">Remaining = budget − spent.</p>
            ) : null}
          </header>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Expense</span>
              <span>Amount</span>
            </div>

            {expenses.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No expenses on this bill yet.</p>
            ) : (
              <ul>
                {expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    tripId={tripId}
                    expense={expense}
                    selected={editing?.id === expense.id}
                    onEdit={() => setEditing(expense)}
                  />
                ))}
              </ul>
            )}

            <div className="mt-2 space-y-1 border-t-2 border-slate-900 pt-3">
              {spentGroups.length === 0 ? (
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(0, budgetCurrency ?? "USD")}</span>
                </div>
              ) : (
                spentGroups.map((row) => (
                  <div key={row.currency} className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{formatMoney(row.amount, row.currency)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <ExpenseForm
          key={editing?.id ?? "new"}
          tripId={tripId}
          expense={editing ?? undefined}
          defaultCurrency={budgetCurrency ?? "USD"}
          onSaved={() => setEditing(null)}
          onCancelEdit={() => setEditing(null)}
        />
      </div>
    </div>
  );
}

function ExpenseRow({
  tripId,
  expense,
  selected,
  onEdit,
}: {
  tripId: string;
  expense: Expense;
  selected: boolean;
  onEdit: () => void;
}) {
  const mutations = useExpenseMutations(tripId);
  const pushToast = useToast();
  const label = expense.description?.trim() || expense.category;
  const detail = [expense.description ? expense.category : null, formatTripDate(expense.date)]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className={`border-b border-slate-100 py-3 ${selected ? "bg-teal-50/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <p className="text-sm font-semibold text-slate-900">
            {formatMoney(Number(expense.amount), expense.currency)}
          </p>
          <button
            type="button"
            aria-label={`Edit ${label}`}
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${label}`}
            onClick={async () => {
              try {
                await mutations.remove.mutateAsync(expense.id);
                pushToast("Expense deleted.");
              } catch {
                pushToast("Unable to delete expense.");
              }
            }}
            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function ExpenseForm({
  tripId,
  expense,
  defaultCurrency,
  onSaved,
  onCancelEdit,
}: {
  tripId: string;
  expense?: Expense;
  defaultCurrency: string;
  onSaved: () => void;
  onCancelEdit: () => void;
}) {
  const mutations = useExpenseMutations(tripId);
  const pushToast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ExpensePayload>(
    expense
      ? {
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category as ExpensePayload["category"],
          date: toDateInputValue(expense.date) || todayDateInputValue(),
          description: expense.description ?? "",
        }
      : blankExpense(defaultCurrency),
  );

  const save = async () => {
    const amount = roundMoney(Number(form.amount));

    if (!form.date || !Number.isFinite(amount) || amount <= 0) {
      setError("Amount and date are required.");
      return;
    }

    setError(null);
    const payload = { ...form, amount, currency: form.currency.toUpperCase() };

    try {
      if (expense) {
        await mutations.update.mutateAsync({ expenseId: expense.id, payload });
        pushToast("Expense updated.");
        onSaved();
      } else {
        await mutations.create.mutateAsync(payload);
        pushToast("Expense added.");
        setForm(blankExpense(defaultCurrency));
        onSaved();
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save expense.");
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{expense ? "Edit expense" : "Add expense"}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Amount
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={form.amount || ""}
            onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
          />
        </label>
        <label className="text-sm text-slate-600">
          Currency
          <CurrencySelect
            className={fieldClass}
            value={form.currency}
            onChange={(currency) => setForm({ ...form, currency })}
          />
        </label>
        <label className="text-sm text-slate-600">
          Category
          <select
            className={fieldClass}
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value as ExpensePayload["category"] })}
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Date
          <input
            className={fieldClass}
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          Name
          <input
            className={fieldClass}
            value={form.description ?? ""}
            placeholder="Hotel, flight, dinner…"
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <button type="button" onClick={save} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">
            Save
          </button>
          {expense ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
