import "dotenv/config";
import assert from "node:assert/strict";
import dns from "node:dns";
import mongoose from "mongoose";
import { User } from "../src/models/User.ts";

const baseUrl = "http://localhost:5000";
const stamp = Date.now();
const password = "password123";
const emailA = `section4-a-${stamp}@example.com`;
const emailB = `section4-b-${stamp}@example.com`;

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

type AuthBody = { data: { token: string } };
type TripBody = { data: { id: string } };
type NotesBody = {
  data: {
    unreadCount: number;
    notifications: Array<{ id: string; message: string; relatedTravelItemId?: string }>;
  };
};
type CountBody = { data: { unreadCount: number } };

const createdTripIds: string[] = [];
let tokenA = "";

async function main(): Promise<void> {
  try {
    const anonymous = await api("/api/notifications/unread-count");
    assert.equal(anonymous.status, 401);

    const userA = await api<AuthBody>("/api/auth/register", {
      method: "POST",
      body: { name: "Section Four A", email: emailA, password },
    });
    const userB = await api<AuthBody>("/api/auth/register", {
      method: "POST",
      body: { name: "Section Four B", email: emailB, password },
    });
    assert.equal(userA.status, 201);
    tokenA = userA.data.data.token;
    const tokenB = userB.data.data.token;

    const trip = await api<TripBody>("/api/trips", {
      method: "POST",
      token: tokenA,
      body: {
        name: "Reminder trip",
        origin: "Nepal",
        destination: "America",
        startDate: "2026-04-01",
        endDate: "2026-04-20",
      },
    });
    createdTripIds.push(trip.data.data.id);

    const visa = await api<{ data: { id: string } }>(`/api/trips/${trip.data.data.id}/items`, {
      method: "POST",
      token: tokenA,
      body: {
        title: "Visa",
        category: "Visa",
        expiresAt: isoDaysFromNow(1),
      },
    });

    const first = await api<NotesBody>("/api/notifications", { token: tokenA });
    const second = await api<NotesBody>("/api/notifications", { token: tokenA });
    assert.equal(first.data.data.notifications.length, second.data.data.notifications.length);

    const note = first.data.data.notifications.find(
      (entry) => entry.relatedTravelItemId === visa.data.data.id,
    );
    assert.ok(note);
    assert.match(note.message, /1 day/);

    const count = await api<CountBody>("/api/notifications/unread-count", { token: tokenA });
    assert.equal(count.data.data.unreadCount, first.data.data.unreadCount);

    const stolen = await api(`/api/notifications/${note.id}`, {
      method: "DELETE",
      token: tokenB,
    });
    assert.equal(stolen.status, 404);

    const removed = await api(`/api/notifications/${note.id}`, {
      method: "DELETE",
      token: tokenA,
    });
    assert.equal(removed.status, 200);

    const after = await api<CountBody>("/api/notifications/unread-count", { token: tokenA });
    assert.equal(after.data.data.unreadCount, first.data.data.unreadCount - 1);

    const other = await api<NotesBody>("/api/notifications", { token: tokenB });
    assert.equal(other.data.data.notifications.length, 0);

    console.log("section4 notification API checks passed");
  } finally {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) return;

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
      if (tokenA) {
        await api(`/api/trips/${tripId}`, { method: "DELETE", token: tokenA });
      }
    }

    await User.deleteMany({ email: { $in: [emailA, emailB] } });
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
