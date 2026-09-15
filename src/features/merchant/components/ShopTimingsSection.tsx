import React from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Clock, Calendar, Check, PackageCheck } from "lucide-react-native";

interface ShopTimingsSectionProps {
  timing: string;
  setTiming: (v: string) => void;
  weeklyOff: string;
  setWeeklyOff: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

const TIMING_PRESETS = [
  "9:00 AM - 9:00 PM",
  "8:00 AM - 10:00 PM",
  "7:00 AM - 11:00 PM",
  "10:00 AM - 8:00 PM",
  "24x7 Open",
];

const WEEKLY_OFF_DAYS = [
  "None",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const ShopTimingsSection: React.FC<ShopTimingsSectionProps> = ({
  timing,
  setTiming,
  weeklyOff,
  setWeeklyOff,
  description,
  setDescription,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
          <Clock size={18} color="#f59e0b" />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Business Hours & Pickup Desk
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Set daily counter timings & pickup instructions
          </Text>
        </View>
      </View>

      {/* Operating Timings Presets */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
          Operating Hours / Timings
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
          placeholder="e.g. 9:00 AM - 9:00 PM"
          placeholderTextColor={colors.textMuted}
          value={timing}
          onChangeText={setTiming}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {TIMING_PRESETS.map((preset) => {
            const isSelected = timing === preset;
            return (
              <Pressable
                key={preset}
                accessibilityRole="button"
                onPress={() => setTiming(preset)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? "rgba(245, 158, 11, 0.18)" : colors.background,
                    borderColor: isSelected ? "#f59e0b" : colors.surfaceBorder,
                  },
                ]}
              >
                {isSelected && <Check size={12} color="#f59e0b" />}
                <Text
                  style={[
                    styles.presetChipText,
                    { color: isSelected ? "#f59e0b" : colors.textMuted },
                  ]}
                >
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Weekly Off Days */}
      <View style={styles.sectionBlock}>
        <View style={styles.subTitleRow}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 0 }]}>
            Weekly Off Day
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {WEEKLY_OFF_DAYS.map((day) => {
            const isSelected = (weeklyOff || "None").toLowerCase() === day.toLowerCase();
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                onPress={() => setWeeklyOff(day)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? "rgba(239, 68, 68, 0.15)" : colors.background,
                    borderColor: isSelected ? "#ef4444" : colors.surfaceBorder,
                  },
                ]}
              >
                {isSelected && <Check size={12} color="#ef4444" />}
                <Text
                  style={[
                    styles.presetChipText,
                    { color: isSelected ? "#ef4444" : colors.textMuted },
                  ]}
                >
                  {day === "None" ? "All 7 Days Open" : day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Counter Pickup Instructions & About */}
      <View style={styles.sectionBlock}>
        <View style={styles.subTitleRow}>
          <PackageCheck size={14} color={colors.textMuted} />
          <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 0 }]}>
            Pickup Desk Note / Shop About
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text },
          ]}
          placeholder="e.g. Trusted neighborhood store. For quick 15-minute counter pickup, please show your order OTP at the main billing counter."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionBlock: {
    marginTop: 10,
  },
  subTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 6,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
