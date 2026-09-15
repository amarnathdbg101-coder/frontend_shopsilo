import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { TokenResponse } from "@/features/auth/types";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";

export interface GoogleAuthPayload {
  id_token: string;
}

export const useGoogleAuth = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: GoogleAuthPayload) => {
      const response = await apiClient.post<ApiResponse<TokenResponse>>(
        Endpoints.AUTH.GOOGLE || "/auth/google",
        payload
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
