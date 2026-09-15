import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import {
  ShopReview,
  ReviewPaginationResponse,
  CreateShopReviewRequest,
} from "@/features/shops/types";

export const useShopReviews = (slug: string) => {
  return useQuery({
    queryKey: ["shop-reviews", slug],
    queryFn: async () => {
      try {
        const response = await apiClient.get<
          ApiResponse<ReviewPaginationResponse | ShopReview[]>
        >(`/shops/${slug}/reviews`);
        const payload = response.data?.data;
        if (Array.isArray(payload)) {
          return payload;
        }
        if (payload && "reviews" in payload && Array.isArray(payload.reviews)) {
          return payload.reviews;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(slug),
    retry: 1,
  });
};

export const useAddShopReview = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateShopReviewRequest) => {
      const response = await apiClient.post<ApiResponse<ShopReview>>(
        `/shops/${slug}/reviews`,
        request
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-reviews", slug] });
      queryClient.invalidateQueries({ queryKey: ["shop-detail", slug] });
    },
  });
};
