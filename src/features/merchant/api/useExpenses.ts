import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Expense, CreateExpenseRequest } from "../types";
import { useAuthStore } from "@/store/useAuthStore";

export const useExpenses = (params?: { start_date?: string; end_date?: string }, enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<Expense[]>>(
          Endpoints.MERCHANT.EXPENSES,
          { params }
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
          return [] as Expense[];
        }
        throw err;
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    retry: false,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExpenseRequest) => {
      const res = await apiClient.post<ApiResponse<Expense>>(
        Endpoints.MERCHANT.EXPENSES,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics", "profit"] });
    },
  });
};
