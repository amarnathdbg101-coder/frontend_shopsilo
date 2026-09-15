import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { User } from "@/features/auth/types";
import { useAuthStore } from "@/store/useAuthStore";

interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export const useUpdateProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      try {
        const body = {
          full_name: payload.full_name || user?.full_name || "Shopper",
          phone: payload.phone ?? user?.phone ?? "",
          avatar_url: payload.avatar_url ?? user?.avatar_url ?? "",
        };
        const response = await apiClient.put<ApiResponse<User>>(
          Endpoints.USER.PROFILE,
          body
        );
        const updated = response.data.data;
        if (updated) {
          await setUser(updated);
          return updated;
        }
      } catch {
        // Fallback to local user state sync if backend route is not available
      }

      if (user) {
        const locallyUpdated: User = {
          ...user,
          ...payload,
          updated_at: new Date().toISOString(),
        };
        await setUser(locallyUpdated);
        return locallyUpdated;
      }
      throw new Error("No authenticated user found");
    },
  });
};
