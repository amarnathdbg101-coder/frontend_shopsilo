import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";

/**
 * Logout hook that clears tokens from secure store, resets global auth state,
 * invalidates cached queries, and redirects to login screen.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await logout();
    },
    onSettled: () => {
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
};
