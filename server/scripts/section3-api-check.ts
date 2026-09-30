import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dns from "node:dns";
import { User } from "../src/models/User.ts";

const baseUrl = "http://localhost:5000";
const stamp = Date.now();
const password = "password123";
const emailA = `section3-a-${stamp}@example.com`;
const emailB = `section3-b-${stamp}@example.com`;

const isoDaysFromNow = (days: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

async function api<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<{ status: number; data: T }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as T;
  return { status: response.status, data: payload };
}

type AuthBody = {
  success: true;
  data: { token: string; user: { id: string } };
};

type TripBody = { success: true; data: { id: string; status: string } };
type ItemBody = { success: true; data: { id: string; expiryStatus: string } };
type SearchBody = {
  success: true;
  data: {
    count: number;
    results: Array<{ id: string; kind: string; tripStatus: string; title: string }>;
  };
};
type NotesBody = {
  success: true;
  data: {
    unreadCount: number;
    notifications: Array<{ id: string; read: boolean; message: string; relatedTravelItemId?: string }>;
  };
};

const createdTripIds: string[] = [];
let tokenA = "";

async function main(): Promise<void> {
  try {
  const anonymous = await api("/api/search?q=hotel");
  assert.equal(anonymous.status, 401);

  const userA = await api<AuthBody>("/api/auth/register", {
    method: "POST",
    body: { name: "Section Three A", email: emailA, password },
  });
  const userB = await api<AuthBody>("/api/auth/register", {
    method: "POST",
    body: { name: "Section Three B", email: emailB, password },
  });
  assert.equal(userA.status, 201);
  assert.equal(userB.status, 201);
  const tokenB = userB.data.data.token;
  tokenA = userA.data.data.token;

  const activeTrip = await api<TripBody>("/api/trips", {
    method: "POST",
    token: tokenA,
    body: {
      name: "Spring journey",
      origin: "Nepal",
      destination: "America",
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      status: "active",
    },
  });
  const inactiveTrip = await api<TripBody>("/api/trips", {
    method: "POST",
    token: tokenA,
    body: {
      name: "Old trip",
      origin: "Kathmandu",
      destination: "Doha",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      status: "inactive",
    },
  });
  assert.equal(activeTrip.status, 201);
  createdTripIds.push(activeTrip.data.data.id, inactiveTrip.data.data.id);

  const hotel = await api<ItemBody>(`/api/trips/${activeTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: {
      title: "Hotel Reservation",
      category: "Hotel",
      description: "Hilton Washington DC",
    },
  });
  await api(`/api/trips/${activeTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: {
      title: "Qatar Airways",
      category: "Flight",
      description: "Outbound ticket",
    },
  });
  const visa = await api<ItemBody>(`/api/trips/${activeTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: {
      title: "Visa",
      category: "Visa",
      expiresAt: isoDaysFromNow(14),
    },
  });
  const expired = await api<ItemBody>(`/api/trips/${activeTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: {
      title: "Old Insurance",
      category: "Insurance",
      expiresAt: "2020-01-01",
    },
  });
  const future = await api<ItemBody>(`/api/trips/${activeTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: {
      title: "Future Passport",
      category: "Document",
      expiresAt: isoDaysFromNow(400),
    },
  });
  await api(`/api/trips/${inactiveTrip.data.data.id}/items`, {
    method: "POST",
    token: tokenA,
    body: { title: "City Hotel", category: "Hotel" },
  });

  assert.equal(visa.data.data.expiryStatus, "expiring_soon");
  assert.equal(expired.data.data.expiryStatus, "expired");
  assert.equal(future.data.data.expiryStatus, "active");
  assert.equal(hotel.data.data.expiryStatus, "none");

  const hotelSearch = await api<SearchBody>("/api/search?q=hotel", { token: tokenA });
  const hotelItems = hotelSearch.data.data.results.filter((result) => result.kind === "travel-item");
  assert.equal(hotelItems.length, 2);
  assert.equal(hotelItems[0]?.title, "Hotel Reservation");
  assert.equal(hotelItems[0]?.tripStatus, "active");
  assert.equal(hotelItems[1]?.tripStatus, "inactive");

  const nepalHotel = await api<SearchBody>(
    "/api/search?q=" + encodeURIComponent("Nepal hotel"),
    { token: tokenA },
  );
  assert.ok(
    nepalHotel.data.data.results.some((result) => result.id === hotel.data.data.id),
  );

  const flights = await api<SearchBody>("/api/search?tripStatus=active&category=Flight", {
    token: tokenA,
  });
  assert.equal(flights.data.data.count, 1);
  assert.equal(flights.data.data.results[0]?.title, "Qatar Airways");

  const inactiveHotels = await api<SearchBody>(
    "/api/search?q=hotel&tripStatus=inactive",
    { token: tokenA },
  );
  assert.equal(inactiveHotels.data.data.count, 1);
  assert.equal(inactiveHotels.data.data.results[0]?.title, "City Hotel");

  const soon = await api<SearchBody>("/api/search?expiry=soon", { token: tokenA });
  assert.ok(soon.data.data.results.some((result) => result.id === visa.data.data.id));
  assert.equal(
    soon.data.data.results.some((result) => result.id === expired.data.data.id),
    false,
  );

  const otherUser = await api<SearchBody>("/api/search?q=hotel", { token: tokenB });
  assert.equal(otherUser.data.data.count, 0);

  const firstNotes = await api<NotesBody>("/api/notifications", { token: tokenA });
  const secondNotes = await api<NotesBody>("/api/notifications", { token: tokenA });
  assert.equal(firstNotes.data.data.notifications.length, secondNotes.data.data.notifications.length);
  assert.ok(firstNotes.data.data.unreadCount > 0);
  const visaNote = firstNotes.data.data.notifications.find(
    (note) => note.relatedTravelItemId === visa.data.data.id,
  );
  assert.ok(visaNote);
  assert.equal(visaNote.read, false);

  const marked = await api(`/api/notifications/${visaNote.id}/read`, {
    method: "PATCH",
    token: tokenA,
    body: {},
  });
  assert.equal(marked.status, 200);

  const afterRead = await api<NotesBody>("/api/notifications", { token: tokenA });
  const readNote = afterRead.data.data.notifications.find((note) => note.id === visaNote.id);
  assert.equal(readNote?.read, true);
  assert.ok(afterRead.data.data.unreadCount < firstNotes.data.data.unreadCount);

  const stolen = await api(`/api/notifications/${visaNote.id}/read`, {
    method: "PATCH",
    token: tokenB,
    body: {},
  });
  assert.equal(stolen.status, 404);

  const otherNotes = await api<NotesBody>("/api/notifications", { token: tokenB });
  assert.equal(otherNotes.data.data.notifications.length, 0);

  const inactivated = await api<TripBody>(`/api/trips/${activeTrip.data.data.id}`, {
    method: "PATCH",
    token: tokenA,
    body: { status: "inactive" },
  });
  assert.equal(inactivated.data.data.status, "inactive");

  const reactivated = await api<TripBody>(`/api/trips/${activeTrip.data.data.id}`, {
    method: "PATCH",
    token: tokenA,
    body: { status: "active" },
  });
  assert.equal(reactivated.data.data.status, "active");

  console.log("section3 API checks passed");
  } finally {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      if (mongoose.connection.readyState === 0) {
        const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(",")
          .map((server) => server.trim())
          .filter(Boolean);

        if (dnsServers && dnsServers.length > 0) {
          dns.setServers(dnsServers);
        }

        await mongoose.connect(mongoUri);
      }

      for (const tripId of createdTripIds) {
        if (!tokenA) {
          break;
        }

        await api(`/api/trips/${tripId}`, { method: "DELETE", token: tokenA });
      }

      await User.deleteMany({ email: { $in: [emailA, emailB] } });
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
