import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import {
  CustomerKhataSummary,
  CustomerKhataPassbook,
  DisputeKhataRequest,
  SubmitKhataUPIPaymentRequest,
  KhataTransactionItem,
} from "../types";

export const CUSTOMER_KHATA_KEYS = {
  summary: ["customer_khata", "summary"] as const,
  passbook: (khataId: string) => ["customer_khata", "passbook", khataId] as const,
};

export const useCustomerKhataSummary = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: CUSTOMER_KHATA_KEYS.summary,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CustomerKhataSummary>>(
        Endpoints.CUSTOMER_KHATA.SUMMARY
      );
      return res.data.data;
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
};

export const useCustomerKhataPassbook = (khataId?: string) => {
  return useQuery({
    queryKey: CUSTOMER_KHATA_KEYS.passbook(khataId || ""),
    queryFn: async () => {
      if (!khataId) throw new Error("khataId is required");
      const res = await apiClient.get<ApiResponse<CustomerKhataPassbook>>(
        Endpoints.CUSTOMER_KHATA.PASSBOOK(khataId)
      );
      return res.data.data;
    },
    enabled: !!khataId,
  });
};

export const useDisputeKhataTransaction = (khataId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DisputeKhataRequest) => {
      const res = await apiClient.post<ApiResponse<null>>(
        Endpoints.CUSTOMER_KHATA.DISPUTE(khataId),
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.passbook(khataId) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.summary });
    },
  });
};

export const useSubmitKhataUPIPayment = (khataId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitKhataUPIPaymentRequest) => {
      const res = await apiClient.post<ApiResponse<KhataTransactionItem>>(
        Endpoints.CUSTOMER_KHATA.PAY_UPI(khataId),
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.passbook(khataId) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.summary });
    },
  });
};

export const useSetCustomerPromiseToPay = (khataId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { promise_to_pay_date: string; installment_target: number }) => {
      const res = await apiClient.post<ApiResponse<null>>(
        Endpoints.CUSTOMER_KHATA.PROMISE_DATE(khataId),
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.passbook(khataId) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KHATA_KEYS.summary });
    },
  });
};
