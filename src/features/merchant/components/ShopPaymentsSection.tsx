import React from "react";
import { StyleSheet, Text, View, TextInput, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Phone, MessageSquare, QrCode, Copy } from "lucide-react-native";

interface ShopPaymentsSectionProps {
  phone: string;
  setPhone: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
}

export const ShopPaymentsSection: React.FC<ShopPaymentsSectionProps> = ({
  phone,
  setPhone,
  whatsapp,
  setWhatsapp,
}) => {
  const { colors, isDark } = useThemeColor();

  const handleCopyPhoneToWhatsapp = () => {
    if (phone) {
      setWhatsapp(phone);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconWrap, { backgroundColor: "rgba(59, 130, 246, 0.12)" }]}>
          <Phone size={18} color="#3b82f6" />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact & WhatsApp Ordering
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Direct customer communications & instant payment settlement
          </Text>
        </View>
      </View>

      <View style={styles.inputsList}>
        {/* Calling Phone */}
        <View>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            Calling Contact Phone *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* WhatsApp Phone */}
        <View>
          <View style={styles.labelWithAction}>
            <Text style={[styles.inputLabel, { color: colors.textMuted, marginBottom: 0 }]}>
              WhatsApp Business / Order Number
            </Text>
            {phone ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleCopyPhoneToWhatsapp}
                style={styles.copyBtn}
              >
                <Copy size={11} color="#3b82f6" />
                <Text style={styles.copyBtnText}>Same as Phone</Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 9876543210 (Used for counter bills & notifications)"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={setWhatsapp}
          />
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            {
              backgroundColor: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
              borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#bfdbfe",
            },
          ]}
        >
          <QrCode size={16} color="#3b82f6" />
          <Text style={[styles.infoBannerText, { color: colors.textMuted }]}>
            Customers can reserve products online and pick up at your counter. Receipts are sent via WhatsApp.
          </Text>
        </View>
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
  inputsList: {
    gap: 10,
  },
  labelWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3b82f6",
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
