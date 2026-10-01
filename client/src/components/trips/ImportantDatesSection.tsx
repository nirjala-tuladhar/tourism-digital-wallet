import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import {
  IMPORTANT_DATE_TYPES,
  type ImportantDate,
} from "../../api/importantDates.api";
import { ApiClientError } from "../../api/client";
import {
  useCreateImportantDate,
  useDeleteImportantDate,
  useImportantDates,
  useUpdateImportantDate,
} from "../../hooks/useImportantDates";
import { formatTripDate, isPastDate, toDateInputValue } from "../../lib/date";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { Skeleton } from "../ui/Skeleton";

const dateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  date: z.string().min(1, "Date is required"),
  type: z.enum(IMPORTANT_DATE_TYPES),
  description: z.string().max(2000).optional(),
});

type DateFormValues = z.infer<typeof dateSchema>;

type ImportantDatesSectionProps = {
  tripId: string;
};

export function ImportantDatesSection({ tripId }: ImportantDatesSectionProps) {
  const { data: dates, isLoading, isError, error } = useImportantDates(tripId);
  const createDate = useCreateImportantDate(tripId);
  const updateDate = useUpdateImportantDate(tripId);
  const deleteDate = useDeleteImportantDate(tripId);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ImportantDate | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImportantDate | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DateFormValues>({
    resolver: zodResolver(dateSchema),
    defaultValues: {
      title: "",
      date: "",
      type: "Other",
      description: "",
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    reset({
      title: "",
      date: "",
      type: "Other",
      description: "",
    });
    setShowForm(true);
  };

  const openEdit = (entry: ImportantDate) => {
    setEditing(entry);
    setFormError(null);
    reset({
      title: entry.title,
      date: toDateInputValue(entry.date),
      type: (IMPORTANT_DATE_TYPES.includes(
        entry.type as (typeof IMPORTANT_DATE_TYPES)[number],
      )
        ? entry.type
        : "Other") as (typeof IMPORTANT_DATE_TYPES)[number],
      description: entry.description ?? "",
    });
    setShowForm(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload = {
      title: values.title,
      date: values.date,
      type: values.type,
      description: values.description?.trim() || undefined,
    };

    try {
      if (editing) {
        await updateDate.mutateAsync({ dateId: editing.id, payload });
      } else {
        await createDate.mutateAsync(payload);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to save important date.",
      );
    }
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Important Dates</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Date
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          noValidate
        >
          <h4 className="font-medium text-slate-900">
            {editing ? "Edit important date" : "New important date"}
          </h4>
          {formError ? <FeedbackBanner tone="error" message={formError} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="date-title" className="mb-2 block text-sm font-medium">
                Title
              </label>
              <input
                id="date-title"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("title")}
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-rose-600">{errors.title.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="date-value" className="mb-2 block text-sm font-medium">
                Date
              </label>
              <input
                id="date-value"
                type="date"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("date")}
              />
              {errors.date ? (
                <p className="mt-1 text-sm text-rose-600">{errors.date.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="date-type" className="mb-2 block text-sm font-medium">
                Type
              </label>
              <select
                id="date-type"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("type")}
              >
                {IMPORTANT_DATE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="date-description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="date-description"
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("description")}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : editing ? (
                "Save Date"
              ) : (
                "Add Date"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : null}

      {isError ? (
        <FeedbackBanner
          tone="error"
          message={
            error instanceof ApiClientError
              ? error.message
              : "Unable to load important dates."
          }
        />
      ) : null}

      {!isLoading && !isError && (dates?.length ?? 0) === 0 ? (
        <EmptyState
          title="No important dates yet"
          description="Track departures, check-ins, expiries, and other key moments for this trip."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Date
            </button>
          }
        />
      ) : null}

      <ul className="space-y-3">
        {dates?.map((entry) => {
          const past = isPastDate(entry.date);

          return (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {formatTripDate(entry.date)}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-700">
                  {entry.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.type}
                  {past ? " · Past" : " · Upcoming"}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={`Edit ${entry.title}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(entry)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                  aria-label={`Delete ${entry.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete important date?"
        description="This permanently removes the date from this trip."
        confirmLabel="Delete Date"
        destructive
        busy={deleteDate.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteDate.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
