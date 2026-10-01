import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type AuthPayload = {
  user: AuthUser;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiSuccessResponse<AuthPayload>>(
      "/api/auth/login",
      credentials,
    ),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<ApiSuccessResponse<AuthPayload>>(
      "/api/auth/register",
      credentials,
    ),

  me: (token: string) =>
    apiClient.get<ApiSuccessResponse<{ user: AuthUser }>>(
      "/api/auth/me",
      token,
    ),

  logout: (token: string) =>
    apiClient.post<ApiSuccessResponse<{ message: string }>>(
      "/api/auth/logout",
      undefined,
      token,
    ),

  updateProfile: (name: string, token: string) =>
    apiClient.patch<ApiSuccessResponse<{ user: AuthUser }>>(
      "/api/auth/profile",
      { name },
      token,
    ),

  changePassword: (
    payload: { currentPassword: string; newPassword: string },
    token: string,
  ) =>
    apiClient.patch<ApiSuccessResponse<{ message: string }>>(
      "/api/auth/password",
      payload,
      token,
    ),
};
