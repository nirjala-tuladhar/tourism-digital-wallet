import assert from "node:assert/strict";
import { getExpirySnapshot } from "../src/config/expiry.ts";
import {
  buildSearchResults,
  type SearchItemRecord,
  type SearchTripRecord,
} from "../src/services/search.logic.ts";

const trips: SearchTripRecord[] = [
  {
    id: "trip-active",
    name: "Spring journey",
    origin: "Nepal",
    destination: "America",
    description: "Family visit",
    status: "active",
    startDate: "2026-04-01T00:00:00.000Z",
    endDate: "2026-04-20T00:00:00.000Z",
  },
  {
    id: "trip-inactive",
    name: "Old trip",
    origin: "Kathmandu",
    destination: "Doha",
    status: "inactive",
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-10T00:00:00.000Z",
  },
];

const items: SearchItemRecord[] = [
  {
    id: "hotel-active",
    tripId: "trip-active",
    title: "Hotel Reservation",
    category: "Hotel",
    description: "Hilton Washington DC",
    labels: [],
    attachmentNames: [],
  },
  {
    id: "flight-active",
    tripId: "trip-active",
    title: "Qatar Airways",
    category: "Flight",
    description: "Outbound ticket",
    labels: ["business"],
    attachmentNames: ["boarding-pass.pdf"],
  },
  {
    id: "hotel-inactive",
    tripId: "trip-inactive",
    title: "City Hotel",
    category: "Hotel",
    labels: [],
    attachmentNames: [],
  },
  {
    id: "visa",
    tripId: "trip-active",
    title: "Visa",
    category: "Visa",
    labels: [],
    expiresAt: "2026-10-14T00:00:00.000Z",
    attachmentNames: ["passport-scan.pdf"],
  },
];

const now = new Date("2026-09-30T00:00:00.000Z");

const hotel = buildSearchResults({
  query: "hotel",
  filters: { tripStatus: "all", expiry: "all" },
  trips,
  items,
  now,
});

assert.deepEqual(
  hotel.filter((result) => result.kind === "travel-item").map((result) => result.id),
  ["hotel-active", "hotel-inactive"],
);
assert.equal(hotel[0]?.id, "hotel-active");
assert.equal(hotel.find((result) => result.id === "hotel-inactive")?.tripStatus, "inactive");

const nepalHotel = buildSearchResults({
  query: "Nepal hotel",
  filters: { tripStatus: "all", expiry: "all" },
  trips,
  items,
  now,
});

assert.equal(nepalHotel.length, 1);
assert.equal(nepalHotel[0]?.id, "hotel-active");
assert.equal(nepalHotel[0]?.matchedOn, "travel-item");
assert.equal(nepalHotel[0]?.tripLabel, "Nepal → America");

const america = buildSearchResults({
  query: "America",
  filters: { tripStatus: "all", expiry: "all" },
  trips,
  items,
  now,
});

assert.ok(america.some((result) => result.kind === "trip" && result.id === "trip-active"));
assert.equal(
  america.some((result) => result.id === "hotel-active"),
  false,
);

const flightFilter = buildSearchResults({
  query: "",
  filters: { tripStatus: "active", category: "Flight", expiry: "all" },
  trips,
  items,
  now,
});

assert.deepEqual(
  flightFilter.map((result) => result.id),
  ["flight-active"],
);

const inactiveHotels = buildSearchResults({
  query: "hotel",
  filters: { tripStatus: "inactive", expiry: "all" },
  trips,
  items,
  now,
});

assert.deepEqual(
  inactiveHotels.map((result) => result.id),
  ["hotel-inactive"],
);

const passport = buildSearchResults({
  query: "passport",
  filters: { tripStatus: "all", expiry: "all" },
  trips,
  items,
  now,
});

assert.equal(passport[0]?.id, "visa");

assert.equal(getExpirySnapshot(null, now).expiryStatus, "none");
assert.equal(
  getExpirySnapshot(new Date("2026-10-14T00:00:00.000Z"), now).expiryStatus,
  "expiring_soon",
);
assert.equal(
  getExpirySnapshot(new Date("2026-10-14T00:00:00.000Z"), now).daysUntilExpiry,
  14,
);
assert.equal(
  getExpirySnapshot(new Date("2027-03-01T00:00:00.000Z"), now).expiryStatus,
  "active",
);
assert.equal(
  getExpirySnapshot(new Date("2026-09-01T00:00:00.000Z"), now).expiryStatus,
  "expired",
);

const soon = buildSearchResults({
  query: "",
  filters: { tripStatus: "all", expiry: "soon" },
  trips,
  items,
  now,
});

assert.deepEqual(
  soon.map((result) => result.id),
  ["visa"],
);

console.log("section3 search and expiry checks passed");
