import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import { NotifyMeRequest, NotifyMeResponse } from "@/features/catalog/types";

interface NotifyMeParams {
  productId: string;
  request: NotifyMeRequest;
}

export const useNotifyMe = () => {
  return useMutation({
    mutationFn: async ({ productId, request }: NotifyMeParams) => {
      const response = await apiClient.post<ApiResponse<NotifyMeResponse>>(
        `/products/${productId}/notify-me`,
        request
      );
      return response.data.data;
    },
  });
};
