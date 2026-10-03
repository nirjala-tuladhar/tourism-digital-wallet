import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  planningApi,
  type Expense,
  type ExpensePayload,
  type ItineraryPayload,
} from "../api/planning.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

const useToken = () => useAppSelector((state) => state.auth.token);

function useInvalidateTrip(tripId: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.checklist(tripId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseBoard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  };
}

export function useItinerary(tripId: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.itinerary(tripId),
    enabled: Boolean(token),
    queryFn: async () => (await planningApi.listItinerary(tripId, token!)).data,
  });
}

export function useChecklist(tripId: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.checklist(tripId),
    enabled: Boolean(token),
    queryFn: async () => (await planningApi.listChecklist(tripId, token!)).data,
  });
}

export function useExpenses(tripId: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.expenses(tripId),
    enabled: Boolean(token),
    queryFn: async () => (await planningApi.listExpenses(tripId, token!)).data,
  });
}

export function useItineraryMutations(tripId: string) {
  const token = useToken()!;
  const refresh = useInvalidateTrip(tripId);
  const create = useMutation({
    mutationFn: (payload: ItineraryPayload) => planningApi.createItinerary(tripId, payload, token),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<ItineraryPayload> }) =>
      planningApi.updateItinerary(tripId, itemId, payload, token),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => planningApi.deleteItinerary(tripId, itemId, token),
    onSuccess: refresh,
  });
  return { create, update, remove };
}

export function useChecklistMutations(tripId: string) {
  const token = useToken()!;
  const refresh = useInvalidateTrip(tripId);
  const create = useMutation({
    mutationFn: (title: string) => planningApi.createChecklist(tripId, title, token),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: { title?: string; completed?: boolean } }) =>
      planningApi.updateChecklist(tripId, itemId, payload, token),
    onSuccess: refresh,
  });
  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => planningApi.reorderChecklist(tripId, orderedIds, token),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => planningApi.deleteChecklist(tripId, itemId, token),
    onSuccess: refresh,
  });
  return { create, update, reorder, remove };
}

export function useExpenseMutations(tripId: string) {
  const token = useToken()!;
  const queryClient = useQueryClient();
  const refresh = useInvalidateTrip(tripId);
  const writeExpenses = (next: Expense[]) => {
    queryClient.setQueryData<Expense[]>(queryKeys.expenses(tripId), next);
  };
  const create = useMutation({
    mutationFn: (payload: ExpensePayload) => planningApi.createExpense(tripId, payload, token),
    onSuccess: async (response) => {
      const current = queryClient.getQueryData<Expense[]>(queryKeys.expenses(tripId)) ?? [];
      writeExpenses([...current.filter((item) => item.id !== response.data.id), response.data]);
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: string; payload: Partial<ExpensePayload> }) =>
      planningApi.updateExpense(tripId, expenseId, payload, token),
    onSuccess: async (response) => {
      const current = queryClient.getQueryData<Expense[]>(queryKeys.expenses(tripId)) ?? [];
      writeExpenses(current.map((item) => (item.id === response.data.id ? response.data : item)));
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (expenseId: string) => planningApi.deleteExpense(tripId, expenseId, token),
    onSuccess: async (_response, expenseId) => {
      const current = queryClient.getQueryData<Expense[]>(queryKeys.expenses(tripId)) ?? [];
      writeExpenses(current.filter((item) => item.id !== expenseId));
      await refresh();
    },
  });
  return { create, update, remove };
}
