import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Category } from "@/features/catalog/types";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Category[]>>(
        Endpoints.CATEGORIES.LIST
      );
      return response.data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });
};
