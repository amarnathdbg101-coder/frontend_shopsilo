import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/store/useAuthStore";

export interface ShopStaffMember {
  id: string;
  shop_id: string;
  full_name: string;
  phone: string;
  role: "cashier" | "manager";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffInput {
  full_name: string;
  phone: string;
  pin: string; // 4-digit PIN
  role: "cashier" | "manager";
}

export interface UpdateStaffInput {
  id: string;
  full_name?: string;
  phone?: string;
  pin?: string;
  role?: "cashier" | "manager";
  is_active?: boolean;
}

export interface StaffLoginInput {
  shop_id: string;
  phone: string;
  pin: string;
}

export interface StaffLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  staff_id: string;
  full_name: string;
  role: string;
  shop_id: string;
}

// Fetch all staff sub-accounts working in the shop
export const useShopStaff = (enabled: boolean = true) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  return useQuery({
    queryKey: ["merchant", "staff"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<ShopStaffMember[]>>(
          Endpoints.MERCHANT.STAFF.LIST
        );
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated && isMerchant && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

// Create a new cashier/helper sub-account
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStaffInput) => {
      const res = await apiClient.post<ApiResponse<ShopStaffMember>>(
        Endpoints.MERCHANT.STAFF.CREATE,
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "staff"] });
    },
  });
};

// Update a staff member's info, PIN, or active status
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateStaffInput) => {
      const res = await apiClient.put<ApiResponse<ShopStaffMember>>(
        Endpoints.MERCHANT.STAFF.UPDATE(id),
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "staff"] });
    },
  });
};

// Remove a staff sub-account
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const res = await apiClient.delete<ApiResponse<null>>(
        Endpoints.MERCHANT.STAFF.DELETE(staffId)
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "staff"] });
    },
  });
};

// Counter Cashier 4-digit PIN login
export const useStaffLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: StaffLoginInput) => {
      const res = await apiClient.post<ApiResponse<StaffLoginResponse>>(
        Endpoints.MERCHANT.STAFF.LOGIN,
        payload
      );
      const data = res.data.data;

      // Construct synthetic User object for cashier auth store
      const cashierUser = {
        id: data.staff_id,
        email: `${payload.phone}@staff.local`,
        full_name: data.full_name,
        phone: payload.phone,
        role: "cashier",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await setAuth(cashierUser as any, data.access_token);
      return data;
    },
  });
};
