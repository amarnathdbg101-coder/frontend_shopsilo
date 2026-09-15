import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";

export default function Index() {
  const { isAuthenticated, user, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === "admin") {
    return <Redirect href={"/admin" as never} />;
  }

  if (user?.role === "shop") {
    return <Redirect href="/merchant/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
}
