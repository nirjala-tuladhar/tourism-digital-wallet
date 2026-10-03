import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  type ChecklistItem,
  type ItineraryItem,
  type ItineraryPayload,
} from "../../api/planning.api";
import { ApiClientError } from "../../api/client";
import { formatTripDate, toDateInputValue } from "../../lib/date";
import {
  useChecklist,
  useChecklistMutations,
  useItinerary,
  useItineraryMutations,
} from "../../hooks/useTripPlanning";
import { useTravelItems } from "../../hooks/useTravelItems";
import { useToast } from "../ui/ToastProvider";

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function TripChecklist({ tripId }: { tripId: string }) {
  return <ChecklistSection tripId={tripId} />;
}

export function TripPlanning({ tripId }: { tripId: string }) {
  return <ItinerarySection tripId={tripId} />;
}

function ItinerarySection({ tripId }: { tripId: string }) {
  const { data: items = [], isLoading, isError } = useItinerary(tripId);
  const { data: travelItems = [] } = useTravelItems(tripId);
  const mutations = useItineraryMutations(tripId);
  const pushToast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [form, setForm] = useState<ItineraryPayload>({ date: "", title: "" });
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const groups = new Map<string, ItineraryItem[]>();
    for (const item of items) {
      const key = item.date.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [items]);

  const startEdit = (item: ItineraryItem) => {
    setEditing(item);
    setForm({
      date: toDateInputValue(item.date),
      time: item.time ?? "",
      title: item.title,
      location: item.location ?? "",
      description: item.description ?? "",
      travelItemId: item.travelItemId ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.date) {
      setError("Date and title are required.");
      return;
    }
    setError(null);
    const payload: ItineraryPayload = {
      ...form,
      title: form.title.trim(),
      time: form.time?.trim() || null,
      location: form.location?.trim() || null,
      description: form.description?.trim() || null,
      travelItemId: form.travelItemId?.trim() || null,
    };
    try {
      if (editing) {
        await mutations.update.mutateAsync({ itemId: editing.id, payload });
        pushToast("Itinerary updated.");
      } else {
        await mutations.create.mutateAsync(payload);
        pushToast("Itinerary item added.");
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      setError(errorMessage(err, "Unable to save itinerary item."));
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Itinerary</h3>
          <p className="text-sm text-slate-500">Plans grouped by day.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm({ date: "", title: "" });
            setError(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Date
            <input className={fieldClass} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="text-sm text-slate-600">
            Time
            <input className={fieldClass} type="time" value={form.time ?? ""} onChange={(event) => setForm({ ...form, time: event.target.value })} />
          </label>
          <label className="text-sm text-slate-600">
            Title
            <input className={fieldClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="text-sm text-slate-600">
            Location
            <input className={fieldClass} value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </label>
          <label className="text-sm text-slate-600">
            Linked travel item
            <select className={fieldClass} value={form.travelItemId ?? ""} onChange={(event) => setForm({ ...form, travelItemId: event.target.value })}>
              <option value="">None</option>
              {travelItems.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            Notes
            <input className={fieldClass} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={save} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">Save</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">Cancel</button>
          </div>
        </div>
      ) : null}

      {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading itinerary…</p> : null}
      {isError ? <p className="mt-4 text-sm text-rose-600">Unable to load itinerary.</p> : null}
      {!isLoading && items.length === 0 ? <p className="mt-4 text-sm text-slate-500">No plans yet. Add the first stop for this trip.</p> : null}

      <div className="mt-4 space-y-5">
        {grouped.map(([day, entries]) => (
          <div key={day}>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{formatTripDate(entries[0].date)}</p>
            <ul className="mt-2 space-y-2">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {entry.time ? <span className="mr-2 text-sm text-slate-500">{entry.time}</span> : null}
                      {entry.title}
                    </p>
                    {entry.location ? <p className="text-sm text-slate-600">{entry.location}</p> : null}
                    {entry.description ? <p className="text-sm text-slate-500">{entry.description}</p> : null}
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label={`Edit ${entry.title}`} onClick={() => startEdit(entry)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label={`Delete ${entry.title}`} onClick={() => mutations.remove.mutate(entry.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistSection({ tripId }: { tripId: string }) {
  const { data: items = [] } = useChecklist(tripId);
  const mutations = useChecklistMutations(tripId);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const done = items.filter((item) => item.completed).length;

  const move = (item: ChecklistItem, direction: -1 | 1) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const ordered = items.map((entry) => entry.id);
    const [moved] = ordered.splice(index, 1);
    ordered.splice(next, 0, moved);
    mutations.reorder.mutate(ordered);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-slate-900">Travel checklist</h3>
      <p className="mt-1 text-sm text-slate-500">{done} of {items.length} completed</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand" style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }} />
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          mutations.create.mutate(title.trim());
          setTitle("");
        }}
      >
        <label className="sr-only" htmlFor="checklist-title">Checklist item</label>
        <input id="checklist-title" className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Passport, visa, insurance…" />
        <button type="submit" className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">Add</button>
      </form>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
            <button
              type="button"
              aria-pressed={item.completed}
              aria-label={item.completed ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
              onClick={() => mutations.update.mutate({ itemId: item.id, payload: { completed: !item.completed } })}
              className={`inline-flex h-5 w-5 items-center justify-center rounded border ${item.completed ? "border-brand bg-brand text-white" : "border-slate-300"}`}
            >
              {item.completed ? <Check className="h-3 w-3" /> : null}
            </button>
            {editingId === item.id ? (
              <input
                className={fieldClass}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => {
                  if (draft.trim()) mutations.update.mutate({ itemId: item.id, payload: { title: draft.trim() } });
                  setEditingId(null);
                }}
              />
            ) : (
              <button type="button" className={`min-w-0 flex-1 text-left text-sm ${item.completed ? "text-slate-400 line-through" : "text-slate-800"}`} onClick={() => { setEditingId(item.id); setDraft(item.title); }}>
                {item.title}
              </button>
            )}
            <button type="button" aria-label={`Move ${item.title} up`} onClick={() => move(item, -1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><ChevronUp className="h-4 w-4" /></button>
            <button type="button" aria-label={`Move ${item.title} down`} onClick={() => move(item, 1)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><ChevronDown className="h-4 w-4" /></button>
            <button type="button" aria-label={`Delete ${item.title}`} onClick={() => mutations.remove.mutate(item.id)} className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
