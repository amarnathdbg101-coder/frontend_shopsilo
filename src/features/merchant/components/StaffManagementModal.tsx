import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import {
  useShopStaff,
  useCreateStaff,
  useDeleteStaff,
  ShopStaffMember,
} from "../api/useStaff";
import {
  Users,
  UserPlus,
  X,
  Trash2,
  ShieldCheck,
  Phone,
  Key,
  Check,
  UserCheck,
} from "lucide-react-native";

interface StaffManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useThemeColor();

  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"cashier" | "manager">("cashier");

  const { data: staffList = [], isLoading, refetch } = useShopStaff(visible);
  const createStaffMutation = useCreateStaff();
  const deleteStaffMutation = useDeleteStaff();

  const handleAddStaff = () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      return Alert.alert("Required", "Please enter staff's full name.");
    }
    if (!phone.trim() || phone.trim().length < 10) {
      return Alert.alert("Required", "Please enter valid 10-digit mobile number.");
    }
    if (!pin.trim() || pin.trim().length !== 4 || isNaN(Number(pin))) {
      return Alert.alert("Required", "PIN must be exactly 4 numeric digits.");
    }

    createStaffMutation.mutate(
      {
        full_name: fullName.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        role,
      },
      {
        onSuccess: (newStaff) => {
          Alert.alert(
            "Cashier Created! 🎉",
            `"${newStaff.full_name}" is now registered with 4-Digit PIN (${pin.trim()}).`
          );
          setFullName("");
          setPhone("");
          setPin("");
          setActiveTab("list");
          refetch();
        },
        onError: (err: any) => {
          Alert.alert("Failed", err?.message || "Could not add staff member.");
        },
      }
    );
  };

  const handleDeleteStaff = (staff: ShopStaffMember) => {
    Alert.alert(
      "Remove Staff Sub-Account",
      `Are you sure you want to remove "${staff.full_name}" (${staff.phone}) from your shop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deleteStaffMutation.mutate(staff.id, {
              onSuccess: () => {
                Alert.alert("Removed", "Staff member removed successfully.");
                refetch();
              },
              onError: (err: any) => {
                Alert.alert("Error", err?.message || "Could not remove staff.");
              },
            });
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(124, 58, 237, 0.12)" }]}>
                <Users size={18} color="#7c3aed" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  Dukan Helpers & Staff 👥
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Manage cashier sub-accounts & 4-digit PINs
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            <Pressable
              onPress={() => setActiveTab("list")}
              style={[
                styles.tabBtn,
                activeTab === "list" && { backgroundColor: colors.surface, elevation: 2 },
              ]}
            >
              <Users size={13} color={activeTab === "list" ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "list" ? colors.text : colors.textMuted },
                ]}
              >
                Staff List ({staffList.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("add")}
              style={[
                styles.tabBtn,
                activeTab === "add" && { backgroundColor: colors.surface, elevation: 2 },
              ]}
            >
              <UserPlus size={13} color={activeTab === "add" ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "add" ? colors.text : colors.textMuted },
                ]}
              >
                + Add New Cashier
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {activeTab === "list" ? (
              /* 📋 TAB 1: STAFF MEMBERS LIST */
              isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#7c3aed" />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Loading shop staff...
                  </Text>
                </View>
              ) : staffList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <ShieldCheck size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Staff Members Added
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    Add your cashiers or helpers so they can perform counter billing on their phone using a 4-digit PIN!
                  </Text>
                  <Button
                    title="+ Add First Cashier"
                    size="sm"
                    onPress={() => setActiveTab("add")}
                    style={{ marginTop: 8 }}
                  />
                </View>
              ) : (
                <View style={styles.listWrap}>
                  {staffList.map((member) => (
                    <View
                      key={member.id}
                      style={[
                        styles.staffCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <View style={styles.avatarCircle}>
                        <UserCheck size={18} color="#7c3aed" />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.staffName, { color: colors.text }]}>
                          {member.full_name}
                        </Text>
                        <View style={styles.phoneRow}>
                          <Phone size={11} color={colors.textMuted} />
                          <Text style={[styles.staffPhone, { color: colors.textMuted }]}>
                            {member.phone}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleDeleteStaff(member)}
                        style={styles.trashBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )
            ) : (
              /* ➕ TAB 2: ADD STAFF FORM */
              <View style={styles.formGroup}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    STAFF FULL NAME *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Ramesh Kumar"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    MOBILE NUMBER (FOR COUNTER LOGIN) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="10-Digit Mobile Number"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    COUNTER 4-DIGIT LOGIN PIN *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.surfaceBorder,
                        color: colors.text,
                      },
                    ]}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    placeholder="Set 4-digit PIN (e.g. 1234)"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Role Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    PERMISSIONS ROLE
                  </Text>
                  <View style={styles.roleSelectRow}>
                    <Pressable
                      onPress={() => setRole("cashier")}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor:
                            role === "cashier"
                              ? "rgba(124, 58, 237, 0.15)"
                              : colors.background,
                          borderColor:
                            role === "cashier" ? "#7c3aed" : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          { color: role === "cashier" ? "#7c3aed" : colors.textMuted },
                        ]}
                      >
                        Cashier (Counter Billing Only)
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Button
                  title={
                    createStaffMutation.isPending
                      ? "Creating Sub-Account..."
                      : "Create Staff Sub-Account ✨"
                  }
                  variant="primary"
                  size="md"
                  isLoading={createStaffMutation.isPending}
                  disabled={createStaffMutation.isPending}
                  onPress={handleAddStaff}
                  leftIcon={<Check size={16} color="#fff" />}
                  style={{ marginTop: 6 }}
                />
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scroll: {
    paddingVertical: 4,
  },
  loadingBox: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  listWrap: {
    gap: 8,
  },
  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  staffName: {
    fontSize: 14,
    fontWeight: "800",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  staffPhone: {
    fontSize: 11,
    fontWeight: "600",
  },
  roleBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    color: "#7c3aed",
    fontSize: 10,
    fontWeight: "800",
  },
  trashBtn: {
    padding: 4,
  },
  formGroup: {
    gap: 10,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  roleSelectRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
