import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { User } from "@/features/auth/types";
import { useAuthStore } from "@/store/useAuthStore";

export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User>>(Endpoints.USER.ME);
      const user = response.data.data || (response.data as unknown as User);
      await setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};
