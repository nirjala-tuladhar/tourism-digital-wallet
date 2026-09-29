export const queryKeys = {
  dashboard: ["dashboard"] as const,
  trips: ["trips"] as const,
  trip: (id: string) => ["trips", id] as const,
  travelItems: (tripId: string) => ["trips", tripId, "items"] as const,
  importantDates: (tripId: string) => ["trips", tripId, "dates"] as const,
};
