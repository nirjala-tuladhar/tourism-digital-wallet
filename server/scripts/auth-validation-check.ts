import {
  loginSchema,
  registerSchema,
} from "../src/validators/auth.validators.js";

const message = (schema: typeof registerSchema | typeof loginSchema, body: object): string => {
  const parsed = schema.safeParse(body);
  return parsed.success ? "VALID" : parsed.error.issues[0]?.message ?? "INVALID";
};

const cases: Array<[string, string]> = [
  ["empty name", message(registerSchema, { name: "", email: "ada@example.com", password: "password123" })],
  ["numeric name", message(registerSchema, { name: "12345", email: "ada@example.com", password: "password123" })],
  ["mixed name", message(registerSchema, { name: "John123", email: "ada@example.com", password: "password123" })],
  ["symbol name", message(registerSchema, { name: "John@Doe", email: "ada@example.com", password: "password123" })],
  ["valid name", message(registerSchema, { name: "Nirjala Tuladhar", email: "ada@example.com", password: "password123" })],
  ["empty email", message(registerSchema, { name: "Ada Lovelace", email: "", password: "password123" })],
  ["bad domain", message(registerSchema, { name: "Ada Lovelace", email: "ada@gmail.com123", password: "password123" })],
  ["double dot domain", message(registerSchema, { name: "Ada Lovelace", email: "ada@gmail..com", password: "password123" })],
  ["valid email", message(registerSchema, { name: "Ada Lovelace", email: "ada.lovelace@mail.co.uk", password: "password123" })],
  ["empty password", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "" })],
  ["spaces only", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "        " })],
  ["trailing space", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "password " })],
  ["inner space", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "pass word" })],
  ["short password", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "short" })],
  ["valid register", message(registerSchema, { name: "Ada Lovelace", email: "ada@example.com", password: "password123" })],
  ["login empty password", message(loginSchema, { email: "ada@example.com", password: "" })],
  ["login spaces", message(loginSchema, { email: "ada@example.com", password: "password " })],
  ["login short", message(loginSchema, { email: "ada@example.com", password: "short" })],
];

let failed = 0;

for (const [label, result] of cases) {
  const ok =
    (label.startsWith("valid") && result === "VALID") ||
    (!label.startsWith("valid") && result !== "VALID");
  if (!ok) failed += 1;
  console.log(`${ok ? "ok" : "FAIL"} ${label}: ${result}`);
}

if (failed > 0) {
  process.exit(1);
}
