import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Pressable, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/api/client";
import { BellRing, ChevronRight, X, PackageCheck } from "lucide-react-native";

export interface WSEventPayload {
  event: string;
  payload: {
    reservation_number?: string;
    product_name?: string;
    quantity?: number;
    pickup_code?: string;
    created_at?: string;
  };
  timestamp?: string;
}

export const WebSocketOrderAlertListener: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  const [activeAlert, setActiveAlert] = useState<WSEventPayload | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isMerchant || !token) return;

    const baseURL = apiClient.defaults.baseURL || "https://shop-me-t48p.onrender.com";
    const wsHost = baseURL.replace(/^http/, "ws");
    const wsUrl = `${wsHost}/shops/me/ws?token=${token}`;

    let reconnectTimer: any;

    const connectWS = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WebSocketAlerts] Connected to real-time counter channel 🔔");
        };

        ws.onmessage = (e) => {
          try {
            const data: WSEventPayload = JSON.parse(e.data);
            if (data.event === "NEW_RESERVATION" || data.event === "NEW_POS_SALE") {
              triggerAlert(data);
            }
          } catch (err) {
            console.warn("[WebSocketAlerts] Failed to parse event:", err);
          }
        };

        ws.onerror = (e) => {
          console.log("[WebSocketAlerts] Connection notice, retrying in 10s...");
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWS, 10000);
        };
      } catch (err) {
        reconnectTimer = setTimeout(connectWS, 10000);
      }
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isMerchant, token]);

  const triggerAlert = (data: WSEventPayload) => {
    setActiveAlert(data);

    // Invalidate dashboard & pickup desk queries in 0ms!
    queryClient.invalidateQueries({ queryKey: ["shop", "me", "digest"] });
    queryClient.invalidateQueries({ queryKey: ["reservations"] });

    // Animate banner slide down
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();

    // Auto-hide after 8 seconds
    setTimeout(dismissAlert, 8000);
  };

  const dismissAlert = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setActiveAlert(null));
  };

  if (!activeAlert) return null;

  const { payload } = activeAlert;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bellWrap}>
          <BellRing size={20} color="#ffffff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>🔔 NAYA PICKUP ORDER AAYA!</Text>
          <Text style={styles.bannerBody} numberOfLines={1}>
            {payload.product_name ? `${payload.quantity || 1}x ${payload.product_name}` : "New Order"} • OTP: {payload.pickup_code || "N/A"}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            dismissAlert();
            router.push("/merchant/pickups");
          }}
          style={styles.actionBtn}
        >
          <Text style={styles.actionBtnText}>Pickups Desk</Text>
          <ChevronRight size={14} color="#ffffff" />
        </Pressable>

        <Pressable onPress={dismissAlert} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 28,
    left: 14,
    right: 14,
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    padding: 12,
    zIndex: 999,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  bannerBody: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 2,
  },
});
