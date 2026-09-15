import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";

export interface CreateReportRequest {
  target_type: "shop" | "product" | "review";
  target_id: string;
  reason: string;
  description: string;
}

export const useSubmitReport = () => {
  return useMutation({
    mutationFn: async (input: CreateReportRequest) => {
      const response = await apiClient.post<ApiResponse<{ report: unknown }>>(
        Endpoints.REPORTS,
        input
      );
      return response.data;
    },
  });
};
