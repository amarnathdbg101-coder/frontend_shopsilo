import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Product } from "@/features/catalog/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const useProductDetail = (idOrSlug: string) => {
  return useQuery({
    queryKey: ["product", idOrSlug],
    queryFn: async () => {
      const isUuid = UUID_REGEX.test(idOrSlug);
      const primaryUrl = isUuid
        ? Endpoints.PRODUCTS.DETAIL(idOrSlug)
        : Endpoints.PRODUCTS.BY_SLUG(idOrSlug);

      try {
        const response = await apiClient.get<ApiResponse<Product>>(primaryUrl);
        return response.data.data;
      } catch {
        // Fallback to the other endpoint
        const secondaryUrl = isUuid
          ? Endpoints.PRODUCTS.BY_SLUG(idOrSlug)
          : Endpoints.PRODUCTS.DETAIL(idOrSlug);
        const fallbackRes = await apiClient.get<ApiResponse<Product>>(
          secondaryUrl
        );
        return fallbackRes.data.data;
      }
    },
    enabled: !!idOrSlug,
    staleTime: 5 * 60 * 1000,
  });
};

