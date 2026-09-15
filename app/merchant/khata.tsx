import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useKhataCustomers, useKhataAging } from "@/features/merchant/api/useKhata";
import { KhataAgingCard } from "@/features/merchant/components/KhataAgingCard";
import { KhataCustomerCard } from "@/features/merchant/components/KhataCustomerCard";
import { KhataPannaView } from "@/features/merchant/components/KhataPannaView";
import { KhataCustomerQRScannerModal } from "@/features/merchant/components/KhataCustomerQRScannerModal";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import { KhataCustomer } from "@/features/merchant/types";
import { formatCurrency } from "@/utils/format";
import {
  Plus,
  Search,
  X,
  BookOpen,
  UserPlus,
  QrCode,
  Calendar,
  AlertTriangle,
  Users,
  Filter,
} from "lucide-react-native";

type FilterTab = "ALL" | "DUE_TODAY" | "HIGH_DUE" | "DISPUTED";

export default function MerchantKhataScreen() {
  const { colors, isDark } = useThemeColor();
  const { data: shop } = useMyShop();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const [pannaVisible, setPannaVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);

  // New Customer Modal
  const [scannerVisible, setScannerVisible] = useState(false);
  const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");

  const {
    data: customers,
    isLoading: loadingCustomers,
    refetch: refetchCustomers,
  } = useKhataCustomers(debouncedSearch);
  const { data: aging, isLoading: loadingAging, refetch: refetchAging } = useKhataAging();

  // Filtered customer list by tabs
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const todayStr = new Date().toDateString();

    return customers.filter((c) => {
      if (activeTab === "DUE_TODAY") {
        if (!c.promise_to_pay_date || c.current_balance <= 0) return false;
        const d = new Date(c.promise_to_pay_date);
        return d.toDateString() === todayStr || d < new Date();
      }
      if (activeTab === "HIGH_DUE") {
        return c.current_balance >= 2000;
      }
      if (activeTab === "DISPUTED") {
        return (c as any).dispute_status === "PENDING" || (c as any).has_dispute;
      }
      return true;
    });
  }, [customers, activeTab]);

  // Counts for tabs
  const dueTodayCount = useMemo(() => {
    if (!customers) return 0;
    const todayStr = new Date().toDateString();
    return customers.filter((c) => {
      if (!c.promise_to_pay_date || c.current_balance <= 0) return false;
      const d = new Date(c.promise_to_pay_date);
      return d.toDateString() === todayStr || d < new Date();
    }).length;
  }, [customers]);

  const handleOpenPanna = (customer: KhataCustomer) => {
    setSelectedCustomer(customer);
    setPannaVisible(true);
  };

  const handleCustomerScanned = (scanned: { phone: string; name?: string }) => {
    const cleanPhone = scanned.phone.replace(/[^0-9]/g, "").slice(-10);
    const existing = customers?.find((c) => {
      const p = c.customer_mobile.replace(/[^0-9]/g, "").slice(-10);
      return p === cleanPhone;
    });

    if (existing) {
      handleOpenPanna(existing);
    } else {
      const newCust: KhataCustomer = {
        id: "",
        customer_name: scanned.name?.trim() || `Customer ${cleanPhone.slice(-4)}`,
        customer_mobile: cleanPhone,
        credit_limit: 0,
        current_balance: 0,
        closure_status: "ACTIVE",
        last_activity_at: new Date().toISOString(),
      };
      setSelectedCustomer(newCust);
      setPannaVisible(true);
    }
  };

  const handleCreateNewCustomerPanna = () => {
    const cleanMobile = newMobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length < 10) {
      Alert.alert("Mobile Required", "Kripya 10-digit mobile number enter karein.");
      return;
    }
    const cleanName = newName.trim() || `Customer ${cleanMobile.slice(-4)}`;

    const newCust: KhataCustomer = {
      id: "",
      customer_name: cleanName,
      customer_mobile: cleanMobile.length === 10 ? cleanMobile : cleanMobile.slice(-10),
      credit_limit: 0,
      current_balance: 0,
      closure_status: "ACTIVE",
      last_activity_at: new Date().toISOString(),
    };

    setNewCustomerModalVisible(false);
    setNewName("");
    setNewMobile("");
    setSelectedCustomer(newCust);
    setPannaVisible(true);
  };

  const handleRefresh = () => {
    refetchCustomers();
    refetchAging();
  };

  return (
    <ScreenWrapper style={styles.container}>
      {/* Top Header & Search Bar */}
      <View style={styles.topActions}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search customer name or phone..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear khata search"
              onPress={() => setSearch("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan customer khata QR"
          onPress={() => setScannerVisible(true)}
          style={[styles.scanQrBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          <QrCode size={18} color={colors.primary} />
        </Pressable>

        <Button
          title="Naya Panna"
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} color="#fff" />}
          onPress={() => setNewCustomerModalVisible(true)}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setActiveTab("ALL")}
          style={[
            styles.tabBtn,
            activeTab === "ALL"
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === "ALL" ? "#fff" : colors.text }]}>
            All ({customers?.length || 0})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("DUE_TODAY")}
          style={[
            styles.tabBtn,
            activeTab === "DUE_TODAY"
              ? { backgroundColor: "#d97706" }
              : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === "DUE_TODAY" ? "#fff" : colors.text }]}>
            📅 Due Today ({dueTodayCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("HIGH_DUE")}
          style={[
            styles.tabBtn,
            activeTab === "HIGH_DUE"
              ? { backgroundColor: "#dc2626" }
              : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === "HIGH_DUE" ? "#fff" : colors.text }]}>
            ⚠️ High Due (&gt; ₹2k)
          </Text>
        </Pressable>
      </View>

      {loadingAging || loadingCustomers ? (
        <LoadingState message="Loading Khata ledger..." />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item, idx) => item.id || `${item.customer_mobile}_${idx}`}
          ListHeaderComponent={activeTab === "ALL" ? <KhataAgingCard aging={aging || undefined} /> : null}
          renderItem={({ item }) => (
            <KhataCustomerCard
              customer={item}
              onRecordPayment={handleOpenPanna}
              onPressCard={handleOpenPanna}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BookOpen size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === "DUE_TODAY"
                  ? "Aaj Koi Promise Due Nahi Hai"
                  : "Koi Khata Panna Nahi Mila"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {activeTab === "DUE_TODAY"
                  ? "Aaj kisi customer ka repayment date schedule nahi hai."
                  : 'Naya hisab shuru karne ke liye "Naya Panna" dabayein aur customer ka number enter karein.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={loadingCustomers}
        />
      )}

      {/* QR Scanner */}
      <KhataCustomerQRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onCustomerScanned={handleCustomerScanned}
      />

      {/* The Traditional Bahi-Khata Customer Page (Panna) */}
      <KhataPannaView
        visible={pannaVisible}
        customer={selectedCustomer}
        shopName={shop?.name}
        shopUpiId={(shop as any)?.upi_id || "merchant@upi"}
        onClose={() => setPannaVisible(false)}
        onRefreshList={handleRefresh}
      />

      {/* New Customer Khata Modal */}
      <Modal
        visible={newCustomerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNewCustomerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <UserPlus size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Naya Customer Panna Kholein
              </Text>
            </View>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Customer ka 10-digit mobile number enter karein. Agar customer Shopsilo app use karta hai to uska account automatically link ho jayega.
            </Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
              placeholder="Customer ka Naam (e.g. Ramesh Sharma)"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
              placeholder="10-Digit Mobile Number *"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={newMobile}
              onChangeText={setNewMobile}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setNewCustomerModalVisible(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateNewCustomerPanna}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalSubmitText}>Panna Kholein</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    height: "100%",
  },
  scanQrBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
