import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { ProfitReport, ProductMatrixResponse } from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useProfitReport = (period: "day" | "week" | "month" = "month", enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["analytics", "profit", period],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<ProfitReport>>(
          Endpoints.MERCHANT.PROFIT,
          { params: { period } }
        );
        return res.data.data;
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
          return null;
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useProductMatrix = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["analytics", "products-matrix"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<ProductMatrixResponse>>(
          Endpoints.MERCHANT.PRODUCT_MATRIX
        );
        return res.data.data;
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
          return null;
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

