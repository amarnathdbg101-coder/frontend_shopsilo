import React, { useState, useMemo } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useKhataCustomers } from "@/features/merchant/api/useKhata";
import { KhataCustomer } from "@/features/merchant/types";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import { Search, UserCheck, UserPlus, X, Phone, BookOpen, AlertCircle } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: {
    id?: string;
    name: string;
    phone: string;
    current_balance: number;
    credit_limit?: number;
    trust_badge?: string;
    trust_score?: number;
  }) => void;
  currentTotal?: number;
}

export const KhataCustomerPickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectCustomer,
  currentTotal = 0,
}) => {
  const { colors, isDark } = useThemeColor();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: customers = [], isLoading } = useKhataCustomers(undefined, visible);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = (c.customer_name || "").toLowerCase();
      const phone = (c.customer_mobile || "").toLowerCase();
      const id = String(c.id || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [customers, search]);

  const handleSelect = (cust: KhataCustomer) => {
    onSelectCustomer({
      id: cust.id,
      name: cust.customer_name || "Grahak",
      phone: cust.customer_mobile || "",
      current_balance: cust.current_balance || 0,
      credit_limit: cust.credit_limit || 0,
      trust_badge: cust.trust_badge || "Silver",
      trust_score: cust.trust_score || 85,
    });
    onClose();
  };

  const handleCreateNew = () => {
    const name = newName.trim();
    const cleanPhone = newPhone.trim().replace(/[^0-9]/g, "").slice(-10);

    if (!name) {
      setErrorMsg("Grahak ka naam likhna zaroori hai");
      return;
    }

    onSelectCustomer({
      name: name,
      phone: cleanPhone || (cleanPhone ? cleanPhone : `TEMP-${Date.now().toString().slice(-6)}`),
      current_balance: 0,
      credit_limit: parseFloat(newCreditLimit) || 0,
      trust_badge: "New",
      trust_score: 90,
    });

    setNewName("");
    setNewPhone("");
    setNewCreditLimit("");
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheetCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <BookOpen size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Khata Grahak Chunein</Text>
                <Text style={styles.headerSubtitle}>Bina mobile mangwaye 1-tap me udhar jodein</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>

          {/* Tab Switcher */}
          <View style={[styles.tabBar, { borderBottomColor: colors.surfaceBorder }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab("list")}
              style={[
                styles.tabBtn,
                activeTab === "list" && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
              ]}
            >
              <UserCheck size={15} color={activeTab === "list" ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "list" ? colors.primary : colors.textMuted },
                ]}
              >
                Pehle Se Darj ({customers.length})
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab("new")}
              style={[
                styles.tabBtn,
                activeTab === "new" && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
              ]}
            >
              <UserPlus size={15} color={activeTab === "new" ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "new" ? colors.primary : colors.textMuted },
                ]}
              >
                + Naya Grahak
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: Existing Khata Customers */}
          {activeTab === "list" && (
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: colors.surfaceBorder }]}>
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Grahak ka naam ya phone number..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                  />
                  {search.length > 0 && (
                    <Pressable accessibilityRole="button" onPress={() => setSearch("")}>
                      <X size={15} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Scrollable list */}
              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                      Khata accounts load ho rahe hain...
                    </Text>
                  </View>
                ) : filteredCustomers.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <AlertCircle size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Koi grahak nahi mila</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                      "{search}" naam ya number se koi khata darj nahi hai.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setNewName(search);
                        setActiveTab("new");
                      }}
                      style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.quickAddBtnText}>+ "{search}" Ka Naya Khata Banayein</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredCustomers.map((cust) => {
                    const name = cust.customer_name || "Grahak";
                    const mobile = cust.customer_mobile || "No Mobile";
                    const bal = cust.current_balance || 0;
                    const initials = name.slice(0, 2).toUpperCase();

                    return (
                      <Pressable
                        key={cust.id || mobile}
                        accessibilityRole="button"
                        onPress={() => handleSelect(cust)}
                        style={[
                          styles.customerRow,
                          {
                            backgroundColor: isDark ? "#1e293b" : "#ffffff",
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={styles.custLeft}>
                          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>{initials}</Text>
                          </View>
                          <View style={{ gap: 2 }}>
                            <Text style={[styles.custName, { color: colors.text }]}>{name}</Text>
                            <View style={styles.phoneRow}>
                              <Phone size={11} color={colors.textMuted} />
                              <Text style={[styles.custPhone, { color: colors.textMuted }]}>{mobile}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.custRight}>
                          <Text
                            style={[
                              styles.custBal,
                              { color: bal > 0 ? "#dc2626" : "#16a34a" },
                            ]}
                          >
                            ₹{bal.toLocaleString("en-IN")} {bal > 0 ? "Baki" : "Jama"}
                          </Text>
                          {currentTotal > 0 && (
                            <Text style={[styles.newBalText, { color: colors.primary }]}>
                              Naya: ₹{(bal + currentTotal).toLocaleString("en-IN")}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* TAB 2: Quick Add New Customer */}
          {activeTab === "new" && (
            <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.infoBanner, { backgroundColor: isDark ? "#1e293b" : "#eff6ff", borderColor: "#bfdbfe" }]}>
                <Text style={[styles.infoBannerText, { color: "#1e40af" }]}>
                  Bina customer ka phone mangwaye, yahan naam likh kar turant udhar bill banayein.
                </Text>
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Grahak Ka Naam (Customer Name) *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: isDark ? "#1e293b" : "#f8fafc" }]}
                  placeholder="e.g. Ramesh Kumar / Pinku Bhaiya"
                  placeholderTextColor={colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Mobile Number (Optional)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: isDark ? "#1e293b" : "#f8fafc" }]}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Credit Limit (Optional)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: isDark ? "#1e293b" : "#f8fafc" }]}
                  placeholder="e.g. 2000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={newCreditLimit}
                  onChangeText={setNewCreditLimit}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleCreateNew}
                style={[styles.submitNewBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.submitNewBtnText}>Grahak Chunein & Udhar Bill Banayein</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "55%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },
  listContent: {
    padding: 12,
    gap: 8,
    paddingBottom: 30,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyWrap: {
    paddingVertical: 36,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
  },
  quickAddBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  custLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  custName: {
    fontSize: 14,
    fontWeight: "800",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  custPhone: {
    fontSize: 11,
  },
  custRight: {
    alignItems: "flex-end",
  },
  custBal: {
    fontSize: 13,
    fontWeight: "800",
  },
  newBalText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  formContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  infoBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  submitNewBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitNewBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
});
