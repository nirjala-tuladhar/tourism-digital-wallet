import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { toDateInputValue } from "../../lib/date";
import type { Trip } from "../../api/trips.api";

const tripFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Trip name is required")
      .max(120, "Trip name must be 120 characters or fewer"),
    origin: z
      .string()
      .trim()
      .min(1, "Origin is required")
      .max(120, "Origin must be 120 characters or fewer"),
    destination: z
      .string()
      .trim()
      .min(1, "Destination is required")
      .max(120, "Destination must be 120 characters or fewer"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    description: z
      .string()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must not be before start date",
      });
    }
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;

type TripFormProps = {
  initialTrip?: Trip;
  submitLabel: string;
  submittingLabel: string;
  serverError?: string | null;
  onSubmit: (values: TripFormValues) => Promise<void> | void;
};

export function TripForm({
  initialTrip,
  submitLabel,
  submittingLabel,
  serverError,
  onSubmit,
}: TripFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: initialTrip?.name ?? "",
      origin: initialTrip?.origin ?? "",
      destination: initialTrip?.destination ?? "",
      startDate: initialTrip ? toDateInputValue(initialTrip.startDate) : "",
      endDate: initialTrip ? toDateInputValue(initialTrip.endDate) : "",
      description: initialTrip?.description ?? "",
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => onSubmit(values))}
      noValidate
    >
      {serverError ? <FeedbackBanner tone="error" message={serverError} /> : null}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
          Trip name <span className="text-rose-600">*</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="off"
          disabled={isSubmitting}
          aria-invalid={errors.name ? "true" : "false"}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
          {...register("name")}
        />
        {errors.name ? (
          <p className="mt-2 text-sm text-rose-600" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="origin" className="mb-2 block text-sm font-medium text-slate-700">
            Origin <span className="text-rose-600">*</span>
          </label>
          <input
            id="origin"
            type="text"
            disabled={isSubmitting}
            aria-invalid={errors.origin ? "true" : "false"}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            {...register("origin")}
          />
          {errors.origin ? (
            <p className="mt-2 text-sm text-rose-600" role="alert">
              {errors.origin.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="destination"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Destination <span className="text-rose-600">*</span>
          </label>
          <input
            id="destination"
            type="text"
            disabled={isSubmitting}
            aria-invalid={errors.destination ? "true" : "false"}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            {...register("destination")}
          />
          {errors.destination ? (
            <p className="mt-2 text-sm text-rose-600" role="alert">
              {errors.destination.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Start date <span className="text-rose-600">*</span>
          </label>
          <input
            id="startDate"
            type="date"
            disabled={isSubmitting}
            aria-invalid={errors.startDate ? "true" : "false"}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            {...register("startDate")}
          />
          {errors.startDate ? (
            <p className="mt-2 text-sm text-rose-600" role="alert">
              {errors.startDate.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            End date <span className="text-rose-600">*</span>
          </label>
          <input
            id="endDate"
            type="date"
            disabled={isSubmitting}
            aria-invalid={errors.endDate ? "true" : "false"}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            {...register("endDate")}
          />
          {errors.endDate ? (
            <p className="mt-2 text-sm text-rose-600" role="alert">
              {errors.endDate.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <input
          id="description"
          type="text"
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
          {...register("description")}
        />
        {errors.description ? (
          <p className="mt-2 text-sm text-rose-600" role="alert">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            {submittingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
