import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchFilters } from "../api/search.api";
import { queryKeys } from "../lib/queryKeys";
import { useAppSelector } from "../store/hooks";

export function useWalletSearch(filters: SearchFilters, enabled: boolean) {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: queryKeys.search(filters),
    enabled: Boolean(token) && enabled,
    queryFn: async () => {
      const response = await searchApi.search(filters, token!);
      return response.data;
    },
  });
}
