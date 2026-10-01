import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripsApi, type CreateTripPayload, type UpdateTripPayload } from "../api/trips.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

const useAuthToken = () => {
  const token = useAppSelector((state) => state.auth.token);

  if (!token) {
    throw new Error("Authentication required");
  }

  return token;
};

export function useTrips() {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.trips,
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await tripsApi.list(token!);
      return response.data;
    },
  });
}

export function useTrip(id: string | undefined) {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.trip(id ?? "unknown"),
    enabled: Boolean(token && id),
    queryFn: async () => {
      const response = await tripsApi.get(id!, token!);
      return response.data;
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: async (payload: CreateTripPayload) => {
      const response = await tripsApi.create(payload, token);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: async (payload: UpdateTripPayload) => {
      const response = await tripsApi.update(id, payload, token);
      return response.data;
    },
    onSuccess: async (trip) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(trip.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const token = useAuthToken();

  return useMutation({
    mutationFn: async (id: string) => {
      await tripsApi.remove(id, token);
      return id;
    },
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
        queryClient.invalidateQueries({ queryKey: queryKeys.trip(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
  });
}
