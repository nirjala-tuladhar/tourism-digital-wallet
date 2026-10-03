import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tripsApi, type Trip, type TripStatus } from "../../api/trips.api";
import { useTrips } from "../../hooks/useTrips";
import { queryKeys } from "../../lib/queryKeys";
import { useAppSelector } from "../../store/hooks";
import { useToast } from "../ui/ToastProvider";

type Prompt = {
  trip: Trip;
  kind: "start" | "end";
  key: string;
  nextStatus: TripStatus;
  title: string;
  description: string;
  confirmLabel: string;
};

const dayKey = (value: string): string => new Date(value).toISOString().slice(0, 10);

function buildPrompt(trip: Trip, today: string): Prompt | null {
  const start = dayKey(trip.startDate);
  const end = dayKey(trip.endDate);

  if ((trip.status === "active" || trip.status === "upcoming") && today > end) {
    const key = `tdw-trip-prompt:${trip.id}:end:${end}`;
    if (localStorage.getItem(key)) return null;
    return {
      trip,
      kind: "end",
      key,
      nextStatus: "completed",
      title: "Your trip has ended",
      description: `Would you like to mark ${trip.name} as completed?`,
      confirmLabel: "Mark Completed",
    };
  }

  if (trip.status === "upcoming" && today === start) {
    const key = `tdw-trip-prompt:${trip.id}:start:${start}`;
    if (localStorage.getItem(key)) return null;
    return {
      trip,
      kind: "start",
      key,
      nextStatus: "active",
      title: "Your trip starts today",
      description: `Would you like to mark ${trip.name} as active?`,
      confirmLabel: "Set Active",
    };
  }

  return null;
}

export function TripStatusPrompt() {
  const { data: trips } = useTrips();
  const token = useAppSelector((state) => state.auth.token);
  const queryClient = useQueryClient();
  const pushToast = useToast();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const prompt = useMemo(() => {
    if (!trips) return null;
    const today = new Date().toISOString().slice(0, 10);
    return trips.map((trip) => buildPrompt(trip, today)).find((entry) => entry && entry.key !== dismissed) ?? null;
  }, [trips, dismissed]);

  if (!prompt || !token) return null;

  const close = () => {
    localStorage.setItem(prompt.key, "dismissed");
    setDismissed(prompt.key);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await tripsApi.update(prompt.trip.id, { status: prompt.nextStatus }, token);
      localStorage.setItem(prompt.key, "accepted");
      setDismissed(prompt.key);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(prompt.trip.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      pushToast(prompt.nextStatus === "active" ? "Trip marked active." : "Trip marked completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="trip-status-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="trip-status-title" className="text-lg font-semibold text-slate-900">{prompt.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{prompt.description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Not Now</button>
          <button type="button" disabled={busy} onClick={confirm} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {prompt.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
