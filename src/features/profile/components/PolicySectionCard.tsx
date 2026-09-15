import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { PolicyItem } from "@/features/profile/constants/policyData";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react-native";

interface PolicySectionCardProps {
  item: PolicyItem;
  defaultExpanded?: boolean;
}

export const PolicySectionCard: React.FC<PolicySectionCardProps> = ({
  item,
  defaultExpanded = true,
}) => {
  const { colors } = useThemeColor();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.header}>
        <View style={styles.titleRow}>
          <ShieldCheck size={16} color={colors.primary} />
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            {item.badge ? (
              <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.badge}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={16} color={colors.textMuted} />
        ) : (
          <ChevronDown size={16} color={colors.textMuted} />
        )}
      </Pressable>

      {isExpanded ? (
        <View style={styles.contentWrap}>
          <Text style={[styles.content, { color: colors.textMuted }]}>{item.content}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 },
  titleTextWrap: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "700" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  contentWrap: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 2 },
  content: { fontSize: 12, lineHeight: 18 },
});
