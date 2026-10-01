import assert from "node:assert/strict";
import { selectExpiryReminder } from "../src/config/expiry.ts";
import { isAllowedOrigin } from "../src/config/cors.ts";

assert.equal(selectExpiryReminder(31), null);
assert.equal(selectExpiryReminder(30)?.dedupeSuffix, "30");
assert.equal(selectExpiryReminder(14)?.kind, "soon");
assert.equal(selectExpiryReminder(7)?.dedupeSuffix, "7");
assert.equal(selectExpiryReminder(5)?.kind, "urgent");
assert.equal(selectExpiryReminder(1)?.kind, "day");
assert.equal(selectExpiryReminder(0)?.kind, "today");
assert.equal(selectExpiryReminder(-3)?.kind, "expired");

assert.equal(selectExpiryReminder(7)?.dedupeSuffix, selectExpiryReminder(3)?.dedupeSuffix);

const previousNodeEnv = process.env.NODE_ENV;
const previousAllow = process.env.CORS_ALLOW_VERCEL;
const previousFrontend = process.env.FRONTEND_URL;

process.env.NODE_ENV = "production";
process.env.CORS_ALLOW_VERCEL = "false";
process.env.FRONTEND_URL = "https://wallet.example.com";

assert.equal(isAllowedOrigin("https://wallet.example.com"), true);
assert.equal(isAllowedOrigin("https://tourism-digital-wallet-preview.vercel.app"), false);
assert.equal(isAllowedOrigin("https://evil.example.com"), false);
assert.equal(isAllowedOrigin(undefined), true);

process.env.NODE_ENV = previousNodeEnv;
process.env.CORS_ALLOW_VERCEL = previousAllow;
process.env.FRONTEND_URL = previousFrontend;

console.log("section4 reminder and CORS checks passed");
