import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../api/auth.api";

const AUTH_STORAGE_KEY = "tdw_auth";

type PersistedAuth = {
  user: AuthUser;
  token: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
};

const readPersistedAuth = (): PersistedAuth | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedAuth;

    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const persistAuth = (auth: PersistedAuth | null): void => {
  if (!auth) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

const persisted = readPersistedAuth();

const initialState: AuthState = {
  user: persisted?.user ?? null,
  token: persisted?.token ?? null,
  isAuthenticated: Boolean(persisted?.token),
  isInitialized: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      persistAuth(action.payload);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      persistAuth(null);
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
