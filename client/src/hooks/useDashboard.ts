import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useDashboard() {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.dashboard,
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await dashboardApi.get(token!);
      return response.data;
    },
  });
}
