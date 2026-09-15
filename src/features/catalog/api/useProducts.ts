import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import {
  Product,
  ProductFilter,
  ProductPaginationResponse,
} from "@/features/catalog/types";

export const useProducts = (filter?: ProductFilter) => {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<ProductPaginationResponse | Product[]>
      >(Endpoints.PRODUCTS.LIST, {
        params: filter,
      });

      const raw = response.data.data;
      if (Array.isArray(raw)) {
        return { products: raw, total_count: raw.length, page: 1, limit: 20, total_pages: 1 };
      }
      return raw || { products: [], total_count: 0, page: 1, limit: 20, total_pages: 0 };
    },
    staleTime: 3 * 60 * 1000,
  });
};

/**
 * Real-App Flipkart/Amazon Style Infinite Scroll Product Pagination Hook.
 * Fetches initial 16 items for 50ms fast screen render, then auto-fetches next pages on scroll.
 */
export const useInfiniteProducts = (filter?: Omit<ProductFilter, "page">) => {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", filter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<
        ApiResponse<ProductPaginationResponse | Product[]>
      >(Endpoints.PRODUCTS.LIST, {
        params: { ...filter, page: pageParam, limit: 16 },
      });

      const raw = response.data.data;
      if (Array.isArray(raw)) {
        return {
          products: raw,
          page: pageParam,
          has_more: false,
          total_count: raw.length,
        };
      }

      const page = raw?.page || pageParam;
      const totalPages = raw?.total_pages || 1;
      return {
        products: raw?.products || [],
        page,
        has_more: page < totalPages,
        total_count: raw?.total_count || (raw?.products?.length ?? 0),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },
    staleTime: 3 * 60 * 1000,
  });
};
