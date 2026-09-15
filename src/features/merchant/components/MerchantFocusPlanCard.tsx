import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BarChart3, Check, ChevronRight, PackageSearch, Tag, Truck } from "lucide-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface MerchantFocusPlanCardProps {
  lowStockCount: number;
  activeReservations: number;
  activeOffersCount: number;
  onInventoryPress: () => void;
  onPickupPress: () => void;
  onOffersPress: () => void;
}

export const MerchantFocusPlanCard: React.FC<MerchantFocusPlanCardProps> = ({
  lowStockCount,
  activeReservations,
  activeOffersCount,
  onInventoryPress,
  onPickupPress,
  onOffersPress,
}) => {
  const { colors } = useThemeColor();
  const tasks = [
    {
      label: lowStockCount ? `Restock ${lowStockCount} low-stock item${lowStockCount === 1 ? "" : "s"}` : "Inventory looks healthy",
      meta: lowStockCount ? "Protect today’s sales" : "No urgent stock alerts",
      done: lowStockCount === 0,
      icon: PackageSearch,
      onPress: onInventoryPress,
      color: "#2563eb",
    },
    {
      label: activeReservations ? `Prepare ${activeReservations} pickup${activeReservations === 1 ? "" : "s"}` : "Pickup desk is clear",
      meta: activeReservations ? "Keep the counter moving" : "No pending reservations",
      done: activeReservations === 0,
      icon: Truck,
      onPress: onPickupPress,
      color: "#0891b2",
    },
    {
      label: activeOffersCount ? "Review live offers" : "Create a customer offer",
      meta: activeOffersCount ? `${activeOffersCount} offer${activeOffersCount === 1 ? "" : "s"} active` : "Bring shoppers back today",
      done: activeOffersCount > 0,
      icon: Tag,
      onPress: onOffersPress,
      color: "#db2777",
    },
  ];
  const completedTasks = tasks.filter((task) => task.done).length;
  const progress = `${(completedTasks / tasks.length) * 100}%` as `${number}%`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primaryLight }]}>
            <BarChart3 size={17} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>SMART WORKLIST</Text>
            <Text style={[styles.title, { color: colors.text }]}>Today’s focus plan</Text>
          </View>
        </View>
        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>{completedTasks}/{tasks.length} done</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
        <View style={[styles.progressFill, { width: progress, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.taskList}>
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Pressable
              key={task.label}
              accessibilityRole="button"
              accessibilityLabel={task.label}
              onPress={task.onPress}
              style={({ pressed }) => [styles.task, pressed && styles.pressed]}
            >
              <View style={[styles.taskIcon, { backgroundColor: `${task.color}14` }]}>
                {task.done ? <Check size={15} color="#15803d" /> : <Icon size={15} color={task.color} />}
              </View>
              <View style={styles.taskCopy}>
                <Text style={[styles.taskLabel, { color: colors.text }]} numberOfLines={1}>{task.label}</Text>
                <Text style={[styles.taskMeta, { color: colors.textMuted }]} numberOfLines={1}>{task.meta}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleGroup: { flexDirection: "row", alignItems: "center", gap: 9 },
  titleIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  progressLabel: { fontSize: 11, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 3, marginTop: 13, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  taskList: { gap: 5, marginTop: 10 },
  task: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 7 },
  pressed: { opacity: 0.68 },
  taskIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  taskCopy: { flex: 1, gap: 1 },
  taskLabel: { fontSize: 12, fontWeight: "800" },
  taskMeta: { fontSize: 10 },
});