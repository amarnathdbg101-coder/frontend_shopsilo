import React from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ShopOperationalDetailsSectionProps {
  pincode: string;
  setPincode: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  weeklyOff: string;
  setWeeklyOff: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

export const ShopOperationalDetailsSection: React.FC<ShopOperationalDetailsSectionProps> = ({
  pincode,
  setPincode,
  whatsapp,
  setWhatsapp,
  weeklyOff,
  setWeeklyOff,
  description,
  setDescription,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Operations & Contact</Text>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Pincode</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 846004"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
          />
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Weekly Off</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. Sunday or None"
            placeholderTextColor={colors.textMuted}
            value={weeklyOff}
            onChangeText={setWeeklyOff}
          />
        </View>
      </View>

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 6 }]}>WhatsApp Order Number</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="e.g. 9876543210 (customers will reach you here)"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 6 }]}>About Your Shop (Description)</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="e.g. Trusted neighborhood grocery store serving fresh dairy and provisions since 2012."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={2}
        value={description}
        onChangeText={setDescription}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  textArea: { height: 60, textAlignVertical: "top", paddingTop: 8 },
});
