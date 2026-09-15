import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { LowStockItem, AdjustStockRequest } from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useLowStockItems = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<any>>(
          Endpoints.MERCHANT.LOW_STOCK
        );
        const raw = res.data?.data;
        if (Array.isArray(raw)) return raw as LowStockItem[];
        if (raw && Array.isArray((raw as any).items)) return (raw as any).items as LowStockItem[];
        return [] as LowStockItem[];
      } catch (err: any) {
        const errMsg = (err?.message || "").toLowerCase();
        const errDetails = (err?.details || "").toString().toLowerCase();
        if (
          err?.status === 404 ||
          err?.statusCode === 404 ||
          err?.response?.status === 404 ||
          errMsg.includes("not register") ||
          errDetails.includes("not register")
        ) {
          return [] as LowStockItem[];
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdjustStockRequest) => {
      const res = await apiClient.post<ApiResponse<{ id: string }>>(
        Endpoints.MERCHANT.ADJUST_STOCK,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDismissStockAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiClient.post<ApiResponse<null>>(
        `/shops/me/inventory/alerts/${productId}/dismiss`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export interface DemandWatchlistItem {
  product_id?: string;
  product_name: string;
  sku?: string;
  current_stock?: number;
  unmet_demand_count: number;
  last_requested_at?: string;
}

export interface DemandWatchlistResponse {
  total_demand_items: number;
  items: DemandWatchlistItem[];
}

export const useDemandWatchlist = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["inventory", "demand-watchlist"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<DemandWatchlistResponse>>(
          Endpoints.MERCHANT.DEMAND_WATCHLIST
        );
        return res.data.data;
      } catch {
        return { total_demand_items: 0, items: [] };
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};
