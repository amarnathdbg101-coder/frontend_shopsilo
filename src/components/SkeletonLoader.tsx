import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ViewStyle } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useThemeColor();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const baseColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Product Card Grid Skeleton Matching Flipkart 2-Column Product Cards
 */
export const ProductCardSkeletonGrid: React.FC = () => {
  return (
    <View style={styles.gridRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.cardSkeleton}>
          <Skeleton height={110} borderRadius={12} />
          <Skeleton width="85%" height={14} style={{ marginTop: 8 }} />
          <Skeleton width="50%" height={16} style={{ marginTop: 6 }} />
          <Skeleton width="100%" height={32} borderRadius={8} style={{ marginTop: 10 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 8,
  },
  cardSkeleton: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 10,
  },
});
