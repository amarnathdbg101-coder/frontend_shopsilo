import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { ScanProductResponse } from "@/features/catalog/types";

export const useScanProduct = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const cleanCode = encodeURIComponent(code.trim());
      const response = await apiClient.get<ApiResponse<ScanProductResponse>>(
        Endpoints.PRODUCTS.SCAN(cleanCode)
      );
      return response.data.data;
    },
  });
};
