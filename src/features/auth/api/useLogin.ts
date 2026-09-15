import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { TokenResponse } from "@/features/auth/types";
import { LoginFormData } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await apiClient.post<ApiResponse<TokenResponse>>(
        Endpoints.AUTH.LOGIN,
        credentials
      );
      return response.data.data || (response.data as unknown as TokenResponse);
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.access_token);
      queryClient.clear();
      if (data.user?.role === "admin") {
        router.replace("/admin" as never);
      } else if (data.user?.role === "shop") {
        router.replace("/merchant/dashboard" as never);
      } else {
        router.replace("/(tabs)");
      }
    },
  });
};
