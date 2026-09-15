import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { ReservationItem, VerifyPickupRequest } from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useMerchantReservations = (status?: string, enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["merchant", "reservations", status],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<any>>(
          Endpoints.MERCHANT.RESERVATIONS,
          { params: status ? { status } : undefined }
        );
        const raw = res.data?.data;
        if (Array.isArray(raw)) return raw as ReservationItem[];
        if (raw && Array.isArray((raw as any).reservations)) return (raw as any).reservations as ReservationItem[];
        if (raw && Array.isArray((raw as any).items)) return (raw as any).items as ReservationItem[];
        return [] as ReservationItem[];
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
          return [] as ReservationItem[];
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useVerifyPickup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VerifyPickupRequest) => {
      const res = await apiClient.post<ApiResponse<ReservationItem>>(
        Endpoints.MERCHANT.VERIFY_PICKUP,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "reservations"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};
