import {
  EXPIRING_SOON_DAYS,
  getExpirySnapshot,
  parseDateOnly,
  type ExpiryStatus,
} from "../config/expiry.js";

export type SearchTripStatus = "all" | "active" | "inactive";
export type SearchExpiryFilter = "all" | "none" | "soon" | "expired";

export type SearchFilters = {
  tripStatus: SearchTripStatus;
  category?: string;
  expiry: SearchExpiryFilter;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type SearchTripRecord = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  description?: string;
  status: "active" | "inactive";
  startDate: string;
  endDate: string;
};

export type SearchItemRecord = {
  id: string;
  tripId: string;
  title: string;
  category: string;
  description?: string;
  labels: string[];
  expiresAt?: string | null;
  attachmentNames: string[];
};

export type SearchResult = {
  kind: "trip" | "travel-item";
  id: string;
  tripId: string;
  travelItemId?: string;
  title: string;
  subtitle?: string;
  category?: string;
  tripName: string;
  tripLabel: string;
  tripStatus: "active" | "inactive";
  matchedOn: "trip" | "travel-item";
  expiresAt?: string | null;
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
};

const RESULT_LIMIT = 40;

export const tokenizeQuery = (query: string): string[] => {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const part of query.toLowerCase().split(/\s+/)) {
    const token = part.trim();

    if (!token || seen.has(token)) {
      continue;
    }

    seen.add(token);
    tokens.push(token);
  }

  return tokens;
};

const tripHaystack = (trip: SearchTripRecord): string =>
  [trip.name, trip.origin, trip.destination, trip.description ?? ""]
    .join(" ")
    .toLowerCase();

const itemHaystack = (item: SearchItemRecord): string =>
  [
    item.title,
    item.category,
    item.description ?? "",
    ...item.labels,
    ...item.attachmentNames,
  ]
    .join(" ")
    .toLowerCase();

const covers = (haystack: string, token: string): boolean =>
  haystack.includes(token);

const hasNarrowingFilter = (filters: SearchFilters): boolean =>
  filters.tripStatus !== "all" ||
  Boolean(filters.category) ||
  filters.expiry !== "all" ||
  Boolean(filters.dateFrom) ||
  Boolean(filters.dateTo);

const itemMatchesDate = (item: SearchItemRecord, filters: SearchFilters): boolean => {
  if (!filters.dateFrom && !filters.dateTo) {
    return true;
  }

  if (!item.expiresAt) {
    return false;
  }

  const expiry = parseDateOnly(item.expiresAt);
  const from = filters.dateFrom ? parseDateOnly(filters.dateFrom) : new Date(0);
  const to = filters.dateTo
    ? parseDateOnly(filters.dateTo)
    : new Date(Date.UTC(9999, 0, 1));

  return expiry.getTime() >= from.getTime() && expiry.getTime() <= to.getTime();
};

const expiryMatches = (
  status: ExpiryStatus,
  filter: SearchExpiryFilter,
): boolean => {
  if (filter === "all") return true;
  if (filter === "none") return status === "none";
  if (filter === "soon") return status === "expiring_soon";
  return status === "expired";
};

const itemFiltersAllow = (
  item: SearchItemRecord,
  trip: SearchTripRecord,
  filters: SearchFilters,
  expiryStatus: ExpiryStatus,
): boolean => {
  if (filters.tripStatus !== "all" && trip.status !== filters.tripStatus) {
    return false;
  }

  if (filters.category && item.category !== filters.category) {
    return false;
  }

  if (!expiryMatches(expiryStatus, filters.expiry)) {
    return false;
  }

  return itemMatchesDate(item, filters);
};

export const buildSearchResults = (input: {
  query: string;
  filters: SearchFilters;
  trips: SearchTripRecord[];
  items: SearchItemRecord[];
  now?: Date;
}): SearchResult[] => {
  const tokens = tokenizeQuery(input.query);
  const now = input.now ?? new Date();

  if (tokens.length === 0 && !hasNarrowingFilter(input.filters)) {
    return [];
  }

  const tripsById = new Map(input.trips.map((trip) => [trip.id, trip]));
  const results: Array<SearchResult & { score: number }> = [];
  const itemFiltersActive =
    Boolean(input.filters.category) ||
    input.filters.expiry !== "all" ||
    Boolean(input.filters.dateFrom) ||
    Boolean(input.filters.dateTo);

  if (!itemFiltersActive) {
    for (const trip of input.trips) {
      if (input.filters.tripStatus !== "all" && trip.status !== input.filters.tripStatus) {
        continue;
      }

      const haystack = tripHaystack(trip);
      const tripHits = tokens.filter((token) => covers(haystack, token));

      if (tokens.length > 0 && tripHits.length !== tokens.length) {
        continue;
      }

      results.push({
        kind: "trip",
        id: trip.id,
        tripId: trip.id,
        title: trip.name,
        subtitle: `${trip.origin} → ${trip.destination}`,
        tripName: trip.name,
        tripLabel: `${trip.origin} → ${trip.destination}`,
        tripStatus: trip.status,
        matchedOn: "trip",
        expiryStatus: "none",
        daysUntilExpiry: null,
        score: (trip.status === "active" ? 1000 : 0) + tripHits.length,
      });
    }
  }

  for (const item of input.items) {
    const trip = tripsById.get(item.tripId);

    if (!trip) {
      continue;
    }

    const snapshot = getExpirySnapshot(
      item.expiresAt ? parseDateOnly(item.expiresAt) : null,
      now,
    );

    if (!itemFiltersAllow(item, trip, input.filters, snapshot.expiryStatus)) {
      continue;
    }

    const tripText = tripHaystack(trip);
    const itemText = itemHaystack(item);
    const itemHits = tokens.filter((token) => covers(itemText, token));
    const covered = tokens.filter(
      (token) => covers(tripText, token) || covers(itemText, token),
    );

    if (tokens.length > 0) {
      if (covered.length !== tokens.length || itemHits.length === 0) {
        continue;
      }
    }

    results.push({
      kind: "travel-item",
      id: item.id,
      tripId: trip.id,
      travelItemId: item.id,
      title: item.title,
      subtitle: item.description?.trim() || item.category,
      category: item.category,
      tripName: trip.name,
      tripLabel: `${trip.origin} → ${trip.destination}`,
      tripStatus: trip.status,
      matchedOn: "travel-item",
      expiresAt: item.expiresAt ?? null,
      expiryStatus: snapshot.expiryStatus,
      daysUntilExpiry: snapshot.daysUntilExpiry,
      score:
        (trip.status === "active" ? 1000 : 0) +
        50 +
        itemHits.length +
        (snapshot.expiryStatus === "expiring_soon" ? 5 : 0),
    });
  }

  results.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.title.localeCompare(right.title);
  });

  return results.slice(0, RESULT_LIMIT).map(({ score: _score, ...result }) => result);
};

export const searchWindowDays = EXPIRING_SOON_DAYS;
