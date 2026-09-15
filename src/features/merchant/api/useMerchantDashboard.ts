import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { MerchantDashboardData } from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useMerchantDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["merchant", "dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MerchantDashboardData>>(
        Endpoints.MERCHANT.DASHBOARD
      );
      return response.data.data;
    },
    enabled: isAuthenticated && isMerchant,
    staleTime: 60 * 1000,
    retry: 1,
  });
};
