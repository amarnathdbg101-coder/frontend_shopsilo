import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import {
  AdminStatsResponse,
  UpdateShopStatusRequest,
  AdminReport,
} from "@/features/admin/types";
import { Shop } from "@/features/shops/types";
import { User } from "@/features/auth/types";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminStatsResponse>>(
        "/admin/stats"
      );
      return response.data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useAdminShops = () => {
  return useQuery({
    queryKey: ["admin", "shops"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Shop[]>>("/admin/shops");
      return response.data.data || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useUpdateShopStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      body,
    }: {
      shopId: string;
      body: UpdateShopStatusRequest;
    }) => {
      const response = await apiClient.patch<ApiResponse<Shop>>(
        `/admin/shops/${shopId}/status`,
        body
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User[]>>("/admin/users");
      return response.data.data || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useAdminReports = () => {
  return useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminReport[]>>(
        "/admin/reports"
      );
      return response.data.data || [];
    },
    staleTime: 60 * 1000,
  });
};
