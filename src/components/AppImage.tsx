import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Image, ImageProps, ImageContentFit } from "expo-image";
import { Config } from "@/constants/config";

export interface AppImageProps extends Omit<ImageProps, "source"> {
  source?: string | { uri: string } | null;
  width?: number | string;
  height?: number | string;
  contentFit?: ImageContentFit;
  borderRadius?: number;
  containerStyle?: ViewStyle;
}

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${Config.API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * High-performance image component using expo-image with automatic
 * relative URL resolution, disk/memory caching, and smooth fade-in.
 */
export const AppImage: React.FC<AppImageProps> = ({
  source,
  width = "100%",
  height = 200,
  contentFit = "cover",
  borderRadius = 0,
  containerStyle,
  style,
  ...imageProps
}) => {
  const uri = typeof source === "string" ? resolveImageUrl(source) : source?.uri ? resolveImageUrl(source.uri) : resolveImageUrl(null);

  return (
    <View
      style={[
        styles.container,
        {
          width: width as number | `${number}%`,
          height: height as number | `${number}%`,
          borderRadius,
        },
        containerStyle,
      ]}
    >
      <Image
        source={{ uri }}
        transition={250}
        cachePolicy="memory-disk"
        contentFit={contentFit}
        style={[
          styles.image,
          {
            borderRadius,
          },
          style,
        ]}
        {...imageProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
