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

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler;
};

const friendlyErrorMessage = (status: number, message: string, hadToken: boolean): string => {
  if (status === 401 && hadToken) {
    return "Your session has expired. Please sign in again.";
  }

  if (status >= 500 || message === "Internal server error" || message.startsWith("Request failed")) {
    return "Something went wrong. Please try again.";
  }

  return message;
};

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
    const rawMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as ApiErrorResponse).message === "string"
        ? (payload as ApiErrorResponse).message
        : `Request failed (${response.status})`;

    if (response.status === 401 && token) {
      onUnauthorized?.();
    }

    throw new ApiClientError(
      friendlyErrorMessage(response.status, rawMessage, Boolean(token)),
      response.status,
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "GET", token }),

  post: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "POST", body, token }),

  patch: <T>(endpoint: string, body?: unknown, token?: string | null) =>
    request<T>(endpoint, { method: "PATCH", body, token }),

  delete: <T>(endpoint: string, token?: string | null) =>
    request<T>(endpoint, { method: "DELETE", token }),
};
