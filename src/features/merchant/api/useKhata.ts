import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import {
  KhataCustomer,
  KhataAgingReport,
  RecordCreditRequest,
  RecordPaymentRequest,
  KhataStatement,
} from "../types";
import { useAuthStore } from "@/store/useAuthStore";

const generateIdempotencyKey = (prefix: string = "khata_app") => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const useKhataCustomers = (search?: string, enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["khata", "customers", search],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<KhataCustomer[]>>(
          Endpoints.MERCHANT.KHATA,
          { params: search ? { search } : undefined }
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
          return [] as KhataCustomer[];
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useKhataAging = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["khata", "aging"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<KhataAgingReport>>(
          Endpoints.MERCHANT.KHATA_AGING
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

export const useRecordCredit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordCreditRequest) => {
      const idempotencyKey = generateIdempotencyKey("credit");
      const res = await apiClient.post<ApiResponse<{ id: string }>>(
        Endpoints.MERCHANT.KHATA,
        payload,
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export const useRecordKhataPayment = (mobile: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordPaymentRequest) => {
      const idempotencyKey = generateIdempotencyKey("payment");
      const res = await apiClient.post<ApiResponse<{ id: string }>>(
        Endpoints.MERCHANT.KHATA_PAYMENT(mobile),
        payload,
        {
          headers: {
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    },
  });
};

export const useKhataStatement = (mobile: string) => {
  return useQuery({
    queryKey: ["khata", "statement", mobile],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<KhataStatement>>(
        Endpoints.MERCHANT.KHATA_STATEMENT(mobile)
      );
      return res.data.data;
    },
    enabled: !!mobile,
  });
};
