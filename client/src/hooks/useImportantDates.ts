import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  importantDatesApi,
  type ImportantDatePayload,
} from "../api/importantDates.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useImportantDates(tripId: string | undefined) {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.importantDates(tripId ?? "unknown"),
    enabled: Boolean(token && tripId),
    queryFn: async () => {
      const response = await importantDatesApi.list(tripId!, token!);
      return response.data;
    },
  });
}

export function useCreateImportantDate(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (payload: ImportantDatePayload) => {
      const response = await importantDatesApi.create(tripId, payload, token);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.importantDates(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}

export function useUpdateImportantDate(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async ({
      dateId,
      payload,
    }: {
      dateId: string;
      payload: Partial<ImportantDatePayload>;
    }) => {
      const response = await importantDatesApi.update(
        tripId,
        dateId,
        payload,
        token,
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.importantDates(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}

export function useDeleteImportantDate(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (dateId: string) => {
      await importantDatesApi.remove(tripId, dateId, token);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.importantDates(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}
