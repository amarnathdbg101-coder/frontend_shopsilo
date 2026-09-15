import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Navigation, Compass } from "lucide-react-native";

interface DistanceFilterBarProps {
  selectedDistance: number;
  onSelectDistance: (km: number) => void;
}

const DISTANCE_PRESETS = [1, 3, 5, 10, 25, 50];

export const DistanceFilterBar: React.FC<DistanceFilterBarProps> = ({
  selectedDistance,
  onSelectDistance,
}) => {
  const { colors } = useThemeColor();
  const [customVal, setCustomVal] = useState("");

  const handleApplyCustom = () => {
    const val = parseFloat(customVal);
    if (!isNaN(val) && val > 0) {
      onSelectDistance(val);
      setCustomVal("");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Compass size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Search Radius</Text>
        </View>
        <Text style={[styles.activeTag, { color: colors.primary }]}>
          Within {selectedDistance} km
        </Text>
      </View>

      {/* Preset Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
        {DISTANCE_PRESETS.map((km) => {
          const isSelected = selectedDistance === km;
          return (
            <Pressable
              key={km}
              onPress={() => onSelectDistance(km)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Navigation
                size={11}
                color={isSelected ? colors.primaryForeground : colors.textMuted}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.primaryForeground : colors.text },
                ]}
              >
                {km} km
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Custom Distance Input */}
      <View style={styles.customRow}>
        <TextInput
          placeholder="Or custom km (e.g. 7)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={customVal}
          onChangeText={setCustomVal}
          style={[
            styles.input,
            { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text },
          ]}
        />
        <Pressable
          onPress={handleApplyCustom}
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.applyBtnText, { color: colors.primaryForeground }]}>Set Radius</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12, gap: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, fontWeight: "800" },
  activeTag: { fontSize: 12, fontWeight: "800" },
  presetsRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "700" },
  customRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, fontSize: 13 },
  applyBtn: { paddingHorizontal: 16, justifyContent: "center", borderRadius: 10 },
  applyBtnText: { fontSize: 12, fontWeight: "800" },
});
