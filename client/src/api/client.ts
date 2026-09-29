import type { ApiErrorResponse } from "../types/api.types";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  if (!API_URL) {
    throw new ApiClientError(
      "API URL is not configured. Set VITE_API_URL in your environment.",
      500,
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError(
      "Unable to reach the server. Please check your connection and try again.",
      0,
    );
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as ApiErrorResponse).message === "string"
        ? (payload as ApiErrorResponse).message
        : `Request failed (${response.status})`;

    throw new ApiClientError(message, response.status);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "GET", token }),

  post: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "POST", body, token }),
};
