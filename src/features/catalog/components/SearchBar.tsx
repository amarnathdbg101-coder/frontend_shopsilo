import React from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import { Search, X } from "lucide-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onPressSearchModal?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onPressSearchModal,
  placeholder = "Search local shops, products, brands...",
}) => {
  const { colors } = useThemeColor();

  return (
    <Pressable
      onPress={onPressSearchModal}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      <Search size={18} color={colors.primary} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onPressSearchModal}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        editable={!onPressSearchModal}
        pointerEvents={onPressSearchModal ? "none" : "auto"}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
  },
});
