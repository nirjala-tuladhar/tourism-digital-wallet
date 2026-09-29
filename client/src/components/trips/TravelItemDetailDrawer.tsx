import { FileImage, FileText, Pencil } from "lucide-react";
import type { TravelItem } from "../../api/travelItems.api";
import type { ImportantDate } from "../../api/importantDates.api";
import { formatTripDate, relativeUpdatedAt } from "../../lib/date";
import { getCategoryMeta } from "../../lib/travelCategories";
import { Drawer } from "../ui/Drawer";

type TravelItemDetailDrawerProps = {
  item: TravelItem | null;
  relatedDates?: ImportantDate[];
  open: boolean;
  onClose: () => void;
  onEdit: (item: TravelItem) => void;
};

export function TravelItemDetailDrawer({
  item,
  relatedDates = [],
  open,
  onClose,
  onEdit,
}: TravelItemDetailDrawerProps) {
  if (!item) {
    return null;
  }

  const meta = getCategoryMeta(item.category);
  const Icon = meta.icon;

  return (
    <Drawer
      open={open}
      title={item.title}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
      }
    >
      <div className="space-y-6">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${meta.soft} ${meta.accent}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {meta.label}
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title
          </h3>
          <p className="mt-1 text-base font-medium text-slate-900">{item.title}</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {item.description?.trim()
              ? item.description
              : "No description added yet."}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Labels
          </h3>
          {item.labels.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No labels</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Important information
          </h3>
          {relatedDates.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {relatedDates.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {formatTripDate(entry.date)}
                  </p>
                  <p className="text-xs text-slate-600">
                    {entry.title} · {entry.type}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              No linked important dates for this item yet.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Attachments
          </h3>
          <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <div className="flex gap-2 text-slate-400">
                <FileImage className="h-5 w-5" aria-hidden="true" />
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Coming in Section 2</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Images and PDFs for this travel item will appear here once file
                  uploads are enabled.
                </p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-xs text-slate-500">
          {relativeUpdatedAt(item.updatedAt)}
        </p>
      </div>
    </Drawer>
  );
}
