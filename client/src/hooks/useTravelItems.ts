import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  travelItemsApi,
  type TravelItemPayload,
} from "../api/travelItems.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useTravelItems(tripId: string | undefined) {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.travelItems(tripId ?? "unknown"),
    enabled: Boolean(token && tripId),
    queryFn: async () => {
      const response = await travelItemsApi.list(tripId!, token!);
      return response.data;
    },
  });
}

export function useCreateTravelItem(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (payload: TravelItemPayload) => {
      const response = await travelItemsApi.create(tripId, payload, token);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.travelItems(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useUpdateTravelItem(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: Partial<TravelItemPayload>;
    }) => {
      const response = await travelItemsApi.update(
        tripId,
        itemId,
        payload,
        token,
      );
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.travelItems(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}

export function useDeleteTravelItem(tripId: string) {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (itemId: string) => {
      await travelItemsApi.remove(tripId, itemId, token);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.travelItems(tripId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
  });
}
