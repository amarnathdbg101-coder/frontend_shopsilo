import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import {
  Shop,
  ShopFilter,
  ShopPaginationResponse,
} from "@/features/shops/types";

export const useShops = (filter?: ShopFilter) => {
  return useQuery({
    queryKey: ["shops", filter],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<ShopPaginationResponse | Shop[]>
      >(Endpoints.SHOPS.LIST, {
        params: filter,
      });

      const raw = response.data.data;
      if (Array.isArray(raw)) {
        return { shops: raw, total_count: raw.length, page: 1, limit: 20, total_pages: 1 };
      }
      return raw || { shops: [], total_count: 0, page: 1, limit: 20, total_pages: 0 };
    },
    staleTime: 5 * 60 * 1000,
  });
};
