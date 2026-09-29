import type { CorsOptions } from "cors";

const splitOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const getConfiguredOrigins = (): string[] => {
  return [
    ...splitOrigins(process.env.FRONTEND_URL),
    ...splitOrigins(process.env.FRONTEND_URLS),
  ];
};

const isVercelPreviewOrigin = (origin: string): boolean => {
  if (process.env.CORS_ALLOW_VERCEL === "false") {
    return false;
  }

  try {
    const { protocol, hostname } = new URL(origin);

    if (protocol !== "https:") {
      return false;
    }

    // Preview + production hosts created by Vercel CLI / Git deploys.
    // Example: tourism-digital-wallet-xxxxx-....vercel.app
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  // Non-browser clients (Postman, server-to-server) often omit Origin.
  if (!origin) {
    return true;
  }

  if (getConfiguredOrigins().includes(origin)) {
    return true;
  }

  return isVercelPreviewOrigin(origin);
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
};
