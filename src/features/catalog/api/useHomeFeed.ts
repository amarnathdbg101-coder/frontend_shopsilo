import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { HomeFeedData } from "../types";

export interface HomeFeedParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
  limit_shops?: number;
  limit_products?: number;
  enabled?: boolean;
}

export const useHomeFeed = (params?: HomeFeedParams) => {
  const isEnabled = params?.enabled !== undefined ? params.enabled : true;

  return useQuery({
    queryKey: ["catalog", "home-feed", params?.lat, params?.lng, params?.radius_km, params?.city],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<HomeFeedData>>(
        Endpoints.CATALOG.HOME_FEED,
        {
          params: {
            lat: params?.lat,
            lng: params?.lng,
            radius_km: params?.radius_km ?? 10,
            city: params?.city,
            limit_shops: params?.limit_shops ?? 6,
            limit_products: params?.limit_products ?? 20,
          },
        }
      );
      return (
        response.data.data || {
          categories: [],
          shops: [],
          products: [],
        }
      );
    },
    enabled: isEnabled,
    staleTime: 4 * 60 * 1000,
  });
};
