import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import {
  MakeOfferRequest,
  BargainNegotiationResponse,
} from "@/features/catalog/types";

interface MakeOfferParams {
  productId: string;
  request: MakeOfferRequest;
}

export const useMakeOffer = () => {
  return useMutation({
    mutationFn: async ({ productId, request }: MakeOfferParams) => {
      const response = await apiClient.post<
        ApiResponse<BargainNegotiationResponse>
      >(`/products/${productId}/make-offer`, request);
      return response.data.data;
    },
  });
};
