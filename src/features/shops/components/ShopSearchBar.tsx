import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Search, X } from "lucide-react-native";

interface ShopSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  shopName: string;
  placeholder?: string;
}

export const ShopSearchBar: React.FC<ShopSearchBarProps> = ({
  value,
  onChangeText,
  shopName,
  placeholder,
}) => {
  const { colors, isDark } = useThemeColor();
  const [isFocused, setIsFocused] = useState(false);

  const displayPlaceholder =
    placeholder || ("Search in " + shopName + " (Doodh, Tel, Atta)...");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1e293b" : colors.surface,
          borderColor: isFocused ? colors.primary : colors.surfaceBorder,
        },
      ]}
    >
      <Search size={16} color={isFocused ? colors.primary : colors.textMuted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={displayPlaceholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <X size={14} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});
