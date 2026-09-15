import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { ApiResponse } from "@/types/api";
import { Shop, ShopDailyDigest } from "@/features/shops/types";
import { useAuthStore } from "@/store/useAuthStore";
import { saveLocalCache, loadLocalCache } from "@/utils/persistentCache";

export const useMyShop = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["shop", "me"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<Shop>>("/shops/me");
        if (res.data.data) {
          saveLocalCache("my_shop", res.data.data, 15);
        }
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
        const cached = await loadLocalCache<Shop>("my_shop");
        if (cached) return cached;
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailyDigest = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["shop", "me", "digest"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<ShopDailyDigest>>("/shops/me/digest");
        if (res.data.data) {
          saveLocalCache("my_shop_digest", res.data.data, 15);
        }
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
        const cached = await loadLocalCache<ShopDailyDigest>("my_shop_digest");
        if (cached) return cached;
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useToggleShopStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isOpen: boolean) => {
      const res = await apiClient.patch<ApiResponse<Shop>>("/shops/me/status", {
        is_open: isOpen,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", "me"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export const useUpdateMyShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Shop>) => {
      const res = await apiClient.put<ApiResponse<Shop>>("/shops/me", updates);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", "me"] });
    },
  });
};

export const useDeleteShop = () => {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete<ApiResponse<{ access_token: string }>>("/shops/me");
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.access_token) {
        setAccessToken(data.data.access_token);
      }
      queryClient.invalidateQueries();
    },
  });
};

export const useRestoreShop = () => {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<{ access_token: string }>>("/shops/me/restore");
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.access_token) {
        setAccessToken(data.data.access_token);
      }
      queryClient.invalidateQueries();
    },
  });
};
