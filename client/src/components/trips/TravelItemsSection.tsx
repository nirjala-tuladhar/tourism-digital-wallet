import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, MoreHorizontal, Pencil, Plus, Star, Trash2, Upload } from "lucide-react";
import {
  TRAVEL_ITEM_CATEGORIES,
  type TravelItem,
} from "../../api/travelItems.api";
import { ApiClientError } from "../../api/client";
import {
  useCreateTravelItem,
  useDeleteTravelItem,
  useTravelItems,
  useUpdateTravelItem,
} from "../../hooks/useTravelItems";
import { useImportantDates } from "../../hooks/useImportantDates";
import { getCategoryMeta } from "../../lib/travelCategories";
import { expiryBadgeClass, formatExpiry, isReasonableExpiryDate } from "../../lib/expiry";
import { relativeUpdatedAt, toDateInputValue } from "../../lib/date";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { Skeleton } from "../ui/Skeleton";
import { TravelItemDetailDrawer } from "./TravelItemDetailDrawer";
import { useToast } from "../ui/ToastProvider";
import { uploadTravelItemFiles } from "../../hooks/useAttachments";
import { useAppSelector } from "../../store/hooks";

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  category: z.enum(TRAVEL_ITEM_CATEGORIES),
  description: z.string().max(2000).optional(),
  expiresAt: z
    .string()
    .trim()
    .refine(isReasonableExpiryDate, "Expiry date must be a valid date"),
  remindMe: z.boolean(),
  reminderDays: z.array(z.union([z.literal(30), z.literal(7), z.literal(1), z.literal(0)])),
  customReminderDate: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

type TravelItemsSectionProps = {
  tripId: string;
  focusItemId?: string | null;
  onFocusCleared?: () => void;
};

export function TravelItemsSection({
  tripId,
  focusItemId,
  onFocusCleared,
}: TravelItemsSectionProps) {
  const { data: items, isLoading, isError, error } = useTravelItems(tripId);
  const { data: dates } = useImportantDates(tripId);
  const createItem = useCreateTravelItem(tripId);
  const updateItem = useUpdateTravelItem(tripId);
  const deleteItem = useDeleteTravelItem(tripId);

  const [viewingItem, setViewingItem] = useState<TravelItem | null>(null);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TravelItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TravelItem | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const pushToast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      category: "Flight",
      description: "",
      expiresAt: "",
      remindMe: false,
      reminderDays: [],
      customReminderDate: "",
    },
  });
  const remindMe = watch("remindMe");
  const reminderDays = watch("reminderDays");

  const openCreate = () => {
    setViewingItem(null);
    setEditingItem(null);
    setFormError(null);
    reset({
      title: "",
      category: "Flight",
      description: "",
      expiresAt: "",
      remindMe: false,
      reminderDays: [],
      customReminderDate: "",
    });
    setPendingFiles([]);
    setShowForm(true);
  };

  const openEdit = (item: TravelItem) => {
    setViewingItem(null);
    setMenuItemId(null);
    setEditingItem(item);
    setFormError(null);
    reset({
      title: item.title,
      category: (TRAVEL_ITEM_CATEGORIES.includes(
        item.category as (typeof TRAVEL_ITEM_CATEGORIES)[number],
      )
        ? item.category
        : "Other") as (typeof TRAVEL_ITEM_CATEGORIES)[number],
      description: item.description ?? "",
      expiresAt: item.expiresAt ? toDateInputValue(item.expiresAt) : "",
      remindMe: item.reminderMode === "custom",
      reminderDays: (item.reminderDays ?? []).filter(
        (day): day is 30 | 7 | 1 | 0 => day === 30 || day === 7 || day === 1 || day === 0,
      ),
      customReminderDate: item.customReminderDates?.[0]
        ? toDateInputValue(item.customReminderDates[0])
        : "",
    });
    setShowForm(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload = {
      title: values.title,
      category: values.category,
      description: values.description?.trim() || undefined,
      labels: editingItem?.labels ?? [],
      expiresAt: values.expiresAt?.trim() ? values.expiresAt : null,
      important: editingItem?.important ?? false,
      reminderMode: values.remindMe ? ("custom" as const) : ("default" as const),
      reminderDays: values.remindMe ? values.reminderDays : [],
      customReminderDates:
        values.remindMe && values.customReminderDate?.trim()
          ? [values.customReminderDate]
          : [],
    };

    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          itemId: editingItem.id,
          payload,
        });
      } else {
        const created = await createItem.mutateAsync(payload);
        if (pendingFiles.length > 0 && token) {
          const uploads = await uploadTravelItemFiles(tripId, created.id, pendingFiles, token);
          const failed = uploads.filter((result) => result.status === "failed");
          if (failed.length > 0) {
            pushToast("Travel item added. Some files could not be uploaded.");
          }
        }
      }
      setPendingFiles([]);
      setShowForm(false);
      setEditingItem(null);
      pushToast(editingItem ? "Travel item updated." : "Travel item added.");
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to save travel item.",
      );
    }
  });

  const relatedDates =
    viewingItem && dates
      ? dates.filter((entry) => entry.travelItemId === viewingItem.id)
      : [];

  useEffect(() => {
    if (!focusItemId || !items) {
      return;
    }

    const match = items.find((item) => item.id === focusItemId);

    if (match) {
      setViewingItem(match);
    }
  }, [focusItemId, items]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Travel Items</h3>
          <p className="text-sm text-slate-500">
            Click a card to view details. Use Edit to make changes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Travel Item
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          noValidate
        >
          <h4 className="font-medium text-slate-900">
            {editingItem ? "Edit travel item" : "New travel item"}
          </h4>
          {formError ? <FeedbackBanner tone="error" message={formError} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-title" className="mb-2 block text-sm font-medium">
                Title
              </label>
              <input
                id="item-title"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("title")}
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-rose-600">{errors.title.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="item-category" className="mb-2 block text-sm font-medium">
                Category
              </label>
              <select
                id="item-category"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("category")}
              >
                {TRAVEL_ITEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="item-expires" className="mb-2 block text-sm font-medium">
                    Expiry date
                    <span className="ml-1 font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="item-expires"
                    type="date"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                    {...register("expiresAt")}
                  />
                </div>
                <label className="flex h-[46px] items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="h-4 w-4 accent-brand" {...register("remindMe")} />
                  Remind me
                </label>
              </div>
              {errors.expiresAt ? (
                <p className="mt-1 text-sm text-rose-600">{errors.expiresAt.message}</p>
              ) : null}
              {remindMe ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {(
                    [
                      [30, "30 days before"],
                      [7, "7 days before"],
                      [1, "1 day before"],
                      [0, "On expiry"],
                    ] as const
                  ).map(([day, label]) => (
                    <label key={day} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand"
                        checked={reminderDays.includes(day)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...reminderDays, day]
                            : reminderDays.filter((value) => value !== day);
                          setValue("reminderDays", next, { shouldValidate: true });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Custom date
                    <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" {...register("customReminderDate")} />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="item-description" className="mb-2 block text-sm font-medium">
                Description
              </label>
              <input
                id="item-description"
                type="text"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                {...register("description")}
              />
            </div>

            {editingItem ? null : (
              <div className="sm:col-span-2">
                <label htmlFor="item-files" className="mb-2 block text-sm font-medium">
                  Files
                </label>
                <input
                  ref={fileInputRef}
                  id="item-files"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  multiple
                  className="sr-only"
                  onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {pendingFiles.length > 0 ? `${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"} selected` : "Upload files"}
                </button>
              </div>
            )}
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
              ) : editingItem ? (
                "Save Item"
              ) : (
                "Add Item"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingFiles([]);
                setShowForm(false);
                setEditingItem(null);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : null}

      {isError ? (
        <FeedbackBanner
          tone="error"
          message={
            error instanceof ApiClientError
              ? error.message
              : "Unable to load travel items."
          }
        />
      ) : null}

      {!isLoading && !isError && (items?.length ?? 0) === 0 ? (
        <EmptyState
          title="No travel items yet"
          description="Add flights, hotels, visas, insurance, and other travel information."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Travel Item
            </button>
          }
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {items?.map((item) => {
          const meta = getCategoryMeta(item.category);
          const Icon = meta.icon;
          const selected = viewingItem?.id === item.id;

          return (
            <article
              key={item.id}
              className={`relative rounded-2xl border bg-white p-4 shadow-sm transition duration-200 ${
                selected
                  ? `border-teal-300 ring-2 ${meta.ring} shadow-md`
                  : "border-slate-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuItemId(null);
                  setViewingItem(item);
                }}
                className="w-full pr-8 text-left focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${meta.soft} ${meta.accent}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${meta.accent}`}>
                      {meta.label}
                    </p>
                    <h4 className="mt-0.5 flex items-center gap-1 truncate font-semibold text-slate-900">
                      {item.important ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Important" /> : null}
                      {item.title}
                    </h4>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">No description</p>
                    )}
                    {item.expiryStatus && item.expiryStatus !== "none" ? (
                      <p
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${expiryBadgeClass(item.expiryStatus)}`}
                      >
                        {formatExpiry(item.expiryStatus, item.daysUntilExpiry ?? null)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {relativeUpdatedAt(item.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>

              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuItemId((current) =>
                      current === item.id ? null : item.id,
                    );
                  }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={`Actions for ${item.title}`}
                  aria-expanded={menuItemId === item.id}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {menuItemId === item.id ? (
                  <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuItemId(null);
                        updateItem.mutate({
                          itemId: item.id,
                          payload: { important: !item.important },
                        });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                      {item.important ? "Unmark important" : "Mark important"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setMenuItemId(null);
                        setDeleteTarget(item);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <TravelItemDetailDrawer
        item={viewingItem}
        relatedDates={relatedDates}
        open={Boolean(viewingItem)}
        onClose={() => {
          setViewingItem(null);
          onFocusCleared?.();
        }}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete travel item?"
        description="This permanently removes the travel item. This action cannot be undone."
        confirmLabel="Delete Item"
        destructive
        busy={deleteItem.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteItem.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
          pushToast("Travel item deleted.");
          if (viewingItem?.id === deleteTarget.id) {
            setViewingItem(null);
          }
        }}
      />
    </section>
  );
}
