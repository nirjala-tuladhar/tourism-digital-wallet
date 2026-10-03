import { apiClient } from "./client";
import type { ApiSuccessResponse } from "../types/api.types";

export type ItineraryItem = {
  id: string;
  tripId: string;
  travelItemId?: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  description?: string;
};

export type ItineraryPayload = {
  date: string;
  time?: string | null;
  title: string;
  location?: string | null;
  description?: string | null;
  travelItemId?: string | null;
};

export type ChecklistItem = {
  id: string;
  tripId: string;
  title: string;
  completed: boolean;
  position: number;
};

export type Expense = {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  description?: string;
};

export const EXPENSE_CATEGORIES = [
  "Accommodation",
  "Transportation",
  "Food",
  "Activities",
  "Shopping",
  "Other",
] as const;

export type ExpenseBoardTrip = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  expenseCount: number;
  spent: Array<{ currency: string; amount: number }>;
};

export type ExpensePayload = {
  amount: number;
  currency: string;
  category: (typeof EXPENSE_CATEGORIES)[number];
  date: string;
  description?: string | null;
};

export const planningApi = {
  listItinerary: (tripId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<ItineraryItem[]>>(`/api/trips/${tripId}/itinerary`, token),
  createItinerary: (tripId: string, payload: ItineraryPayload, token: string) =>
    apiClient.post<ApiSuccessResponse<ItineraryItem>>(`/api/trips/${tripId}/itinerary`, payload, token),
  updateItinerary: (tripId: string, itemId: string, payload: Partial<ItineraryPayload>, token: string) =>
    apiClient.patch<ApiSuccessResponse<ItineraryItem>>(`/api/trips/${tripId}/itinerary/${itemId}`, payload, token),
  deleteItinerary: (tripId: string, itemId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/api/trips/${tripId}/itinerary/${itemId}`, token),

  listChecklist: (tripId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<ChecklistItem[]>>(`/api/trips/${tripId}/checklist`, token),
  createChecklist: (tripId: string, title: string, token: string) =>
    apiClient.post<ApiSuccessResponse<ChecklistItem>>(`/api/trips/${tripId}/checklist`, { title }, token),
  updateChecklist: (tripId: string, itemId: string, payload: { title?: string; completed?: boolean }, token: string) =>
    apiClient.patch<ApiSuccessResponse<ChecklistItem>>(`/api/trips/${tripId}/checklist/${itemId}`, payload, token),
  reorderChecklist: (tripId: string, orderedIds: string[], token: string) =>
    apiClient.patch<ApiSuccessResponse<ChecklistItem[]>>(`/api/trips/${tripId}/checklist/reorder`, { orderedIds }, token),
  deleteChecklist: (tripId: string, itemId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/api/trips/${tripId}/checklist/${itemId}`, token),

  listExpenseBoard: (token: string) =>
    apiClient.get<ApiSuccessResponse<ExpenseBoardTrip[]>>("/api/expenses", token),
  listExpenses: (tripId: string, token: string) =>
    apiClient.get<ApiSuccessResponse<Expense[]>>(`/api/trips/${tripId}/expenses`, token),
  createExpense: (tripId: string, payload: ExpensePayload, token: string) =>
    apiClient.post<ApiSuccessResponse<Expense>>(`/api/trips/${tripId}/expenses`, payload, token),
  updateExpense: (tripId: string, expenseId: string, payload: Partial<ExpensePayload>, token: string) =>
    apiClient.patch<ApiSuccessResponse<Expense>>(`/api/trips/${tripId}/expenses/${expenseId}`, payload, token),
  deleteExpense: (tripId: string, expenseId: string, token: string) =>
    apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/api/trips/${tripId}/expenses/${expenseId}`, token),
};
