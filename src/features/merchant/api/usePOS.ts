import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Product } from "@/features/products/types";
import {
  CreatePOSSaleRequest,
  POSSaleResponse,
  POSDailySummaryResponse,
  WeeklyScorecardResponse,
  ParseParchiResponse,
} from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useCreatePOSSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePOSSaleRequest) => {
      const res = await apiClient.post<ApiResponse<POSSaleResponse>>(
        Endpoints.MERCHANT.POS_SALE,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["khata"] });
    },
  });
};

export const usePOSDailySummary = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["pos", "summary"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<POSDailySummaryResponse>>(
          Endpoints.MERCHANT.POS_SUMMARY
        );
        return res.data.data;
      } catch (err: any) {
        const errMsg = (err?.message || "").toLowerCase();
        const errDetails = (err?.details || "").toString().toLowerCase();
        if (
          err?.status === 404 ||
          err?.statusCode === 404 ||
          err?.response?.status === 404 ||
          errMsg.includes("not register") ||
          errDetails.includes("not register")
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useMerchantProducts = (search?: string) => {
  const cleanSearch = search?.trim() || undefined;

  return useQuery<Product[]>({
    queryKey: ["merchant", "products", cleanSearch],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        Endpoints.MERCHANT.MY_PRODUCTS,
        { params: cleanSearch ? { q: cleanSearch } : undefined }
      );
      const raw = res.data?.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.products)
        ? raw.products
        : [];

      return list.map((p) => ({
        id: String(p.id),
        title: p.title || p.name || "Product",
        sku: p.sku || "",
        price: Number(p.price) || 0,
        description: p.description || "",
        category: p.category || p.category_name || "",
        image_url: p.image_url || p.images?.[0] || "",
        stock: Number(p.stock ?? p.stock_quantity ?? 99),
      }));
    },
    staleTime: 60 * 1000,
  });
};

/**
 * Real-App Infinite Scroll Merchant Product List Hook (For Shopkeeper Inventory Grid)
 * Initial load fetches 16 items for 50ms fast screen render, auto-loads next page on scroll!
 */
export const useInfiniteMerchantProducts = (search?: string) => {
  const cleanSearch = search?.trim() || undefined;

  return useInfiniteQuery({
    queryKey: ["merchant", "products", "infinite", cleanSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<any>(Endpoints.MERCHANT.MY_PRODUCTS, {
        params: {
          q: cleanSearch,
          page: pageParam,
          limit: 16,
        },
      });

      const raw = res.data?.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.products)
        ? raw.products
        : [];

      const mapped: Product[] = list.map((p) => ({
        id: String(p.id),
        title: p.title || p.name || "Product",
        sku: p.sku || "",
        price: Number(p.price) || 0,
        description: p.description || "",
        category: p.category || p.category_name || "",
        image_url: p.image_url || p.images?.[0] || "",
        stock: Number(p.stock ?? p.stock_quantity ?? 99),
      }));

      const page = raw?.page || pageParam;
      const totalPages = raw?.total_pages || 1;

      return {
        products: mapped,
        page,
        has_more: page < totalPages,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },
    staleTime: 60 * 1000,
  });
};

export const useWeeklyScorecard = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["pos", "weekly-scorecard"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<WeeklyScorecardResponse>>(
          Endpoints.MERCHANT.WEEKLY_SCORECARD
        );
        return res.data.data;
      } catch (err: any) {
        const errMsg = (err?.message || "").toLowerCase();
        const errDetails = (err?.details || "").toString().toLowerCase();
        if (
          err?.status === 404 ||
          err?.statusCode === 404 ||
          err?.response?.status === 404 ||
          errMsg.includes("not register") ||
          errDetails.includes("not register")
        ) {
          return null;
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
    staleTime: 3 * 60 * 1000,
  });
};

export const useParseParchi = () => {
  return useMutation({
    mutationFn: async (rawText: string) => {
      const res = await apiClient.post<ApiResponse<ParseParchiResponse>>(
        Endpoints.MERCHANT.PARSE_PARCHI,
        { raw_text: rawText }
      );
      return res.data.data;
    },
  });
};
