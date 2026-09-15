import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { ShopOffer, CreateOfferRequest } from "../types";

export interface UpdateOfferInput extends CreateOfferRequest {
  id: string;
  is_active?: boolean;
}

export interface OfferAuditRecord {
  id: string;
  offer_id: string;
  shop_id: string;
  action: "CREATED" | "UPDATED" | "DELETED";
  previous_title?: string;
  previous_discount_text?: string;
  previous_description?: string;
  new_title?: string;
  new_discount_text?: string;
  new_description?: string;
  changed_by_user_id?: string;
  created_at: string;
}

export const useShopOffers = (slug?: string) => {
  return useQuery({
    queryKey: ["offers", "shop", slug],
    queryFn: async () => {
      if (!slug) return [];
      const res = await apiClient.get<ApiResponse<ShopOffer[] | { offers: ShopOffer[] }>>(
        Endpoints.SHOPS.OFFERS(slug)
      );
      const data = res.data.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as any).offers)) return (data as any).offers;
      return [];
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOfferRequest) => {
      const res = await apiClient.post<ApiResponse<ShopOffer>>(
        Endpoints.MERCHANT.CREATE_OFFER,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
};

export const useUpdateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateOfferInput) => {
      const res = await apiClient.put<ApiResponse<ShopOffer>>(
        Endpoints.MERCHANT.UPDATE_OFFER(id),
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
};

export const useDeleteOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<ApiResponse<null>>(
        Endpoints.MERCHANT.DELETE_OFFER(id)
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
};

export const useOfferHistory = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["offers", "history"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<OfferAuditRecord[]>>(
          Endpoints.MERCHANT.OFFERS_HISTORY
        );
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    enabled,
    staleTime: 10 * 1000,
  });
};
