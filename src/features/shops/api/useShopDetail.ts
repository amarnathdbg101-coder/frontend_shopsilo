import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Shop } from "@/features/shops/types";
import { Product, ProductPaginationResponse } from "@/features/catalog/types";

export const useShopDetail = (slug: string) => {
  return useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Shop>>(
        Endpoints.SHOPS.BY_SLUG(slug)
      );
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

export const useShopProducts = (slug: string) => {
  return useQuery({
    queryKey: ["shopProducts", slug],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<Product[] | { products: Product[] }>
      >(Endpoints.SHOPS.PRODUCTS(slug));
      const raw = response.data.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray((raw as { products: Product[] }).products)) {
        return (raw as { products: Product[] }).products;
      }
      return [];
    },
    enabled: !!slug,
    staleTime: 3 * 60 * 1000,
  });
};

export interface InfiniteShopProductsOptions {
  search?: string;
  category_id?: string;
  limit?: number;
}

/**
 * Real-App Flipkart/Amazon Style Infinite Scroll Shop Product Pagination Hook.
 * Matches the shopkeeper inventory scroll architecture:
 * Initial load fetches 16 items for 50ms fast screen render, then auto-fetches next pages from PostgreSQL as user scrolls.
 */
export const useInfiniteShopProducts = (
  slug: string,
  options?: InfiniteShopProductsOptions
) => {
  const cleanSearch = options?.search?.trim() || undefined;
  const categoryId = options?.category_id || undefined;
  const limit = options?.limit || 16;

  return useInfiniteQuery({
    queryKey: ["shopProducts", "infinite", slug, cleanSearch, categoryId],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<
        ApiResponse<ProductPaginationResponse | Product[]>
      >(Endpoints.SHOPS.PRODUCTS(slug), {
        params: {
          q: cleanSearch,
          category_id: categoryId,
          page: pageParam,
          limit,
        },
      });

      const raw = response.data?.data;
      if (Array.isArray(raw)) {
        return {
          products: raw,
          page: pageParam,
          has_more: false,
          total_count: raw.length,
        };
      }

      const list: Product[] = Array.isArray(raw?.products)
        ? raw.products
        : [];

      const page = Number(raw?.page) || pageParam;
      const totalPages = Number(raw?.total_pages) || 1;
      const totalCount = Number(raw?.total_count) || list.length;

      return {
        products: list,
        page,
        has_more: page < totalPages,
        total_count: totalCount,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },
    enabled: !!slug,
    staleTime: 3 * 60 * 1000,
  });
};
