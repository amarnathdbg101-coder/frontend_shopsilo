import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { RegisterResponse } from "@/features/auth/types";
import { RegisterFormData } from "@/features/auth/schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";

export const useRegister = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (formData: RegisterFormData) => {
      // Strips confirmPassword so payload matches Go UserRegisterRequest exactly
      const { confirmPassword: _, ...payload } = formData;

      const response = await apiClient.post<ApiResponse<RegisterResponse>>(
        Endpoints.AUTH.REGISTER,
        payload
      );
      return response.data.data || (response.data as unknown as RegisterResponse);
    },
    onSuccess: async (data) => {
      if (data.access_token) {
        await setAuth(data.user, data.access_token);
        queryClient.clear();
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    },
  });
};
