import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api/notifications.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useNotifications() {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.notifications,
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await notificationsApi.list(token!);
      return response.data;
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationsApi.markRead(id, token);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async () => {
      const response = await notificationsApi.markAllRead(token);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
