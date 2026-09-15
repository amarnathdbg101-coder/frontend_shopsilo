import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import { LoyaltySummary, StoreOffer } from "@/features/loyalty/types";
import { Endpoints } from "@/api/endpoints";

export const useUserLoyalty = () => {
  return useQuery({
    queryKey: ["user", "loyalty"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<LoyaltySummary>>(
          Endpoints.USER.LOYALTY
        );
        return response.data.data;
      } catch (err: any) {
        // Return graceful fallback if loyalty endpoint is not active
        return {
          user_id: "",
          user_name: "",
          points: 0,
          tier: "Bronze",
          next_tier_points_needed: 0,
          total_points: 0,
          earned_points: 0,
          redeemed_points: 0,
          history: [],
        } as LoyaltySummary;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useAllOffers = (category?: string) => {
  return useQuery({
    queryKey: ["offers", "all", category],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<StoreOffer[]>>(
        "/offers",
        { params: category ? { category } : undefined }
      );
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useShopOffers = (slug?: string) => {
  return useQuery({
    queryKey: ["offers", "shop", slug],
    queryFn: async () => {
      if (!slug) return [];
      const response = await apiClient.get<ApiResponse<StoreOffer[]>>(
        `/shops/${slug}/offers`
      );
      return response.data.data || [];
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
