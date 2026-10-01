import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { queryKeys } from "../lib/queryKeys";
import { setCredentials } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function useProfile() {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.profile,
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await authApi.me(token!);
      return response.data.user;
    },
  });
}

export function useUpdateProfile() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token)!;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await authApi.updateProfile(name, token);
      return response.data.user;
    },
    onSuccess: async (user) => {
      dispatch(setCredentials({ user, token }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useChangePassword() {
  const token = useAppSelector((state) => state.auth.token)!;

  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await authApi.changePassword(payload, token);
    },
  });
}
