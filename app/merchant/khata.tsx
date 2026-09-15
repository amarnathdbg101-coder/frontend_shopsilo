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
  ScrollView,
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
import { ExpressQuickUdharModal } from "@/features/merchant/components/ExpressQuickUdharModal";
import { AIVoiceKhataModal } from "@/features/merchant/components/AIVoiceKhataModal";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import { KhataCustomer } from "@/features/merchant/types";
import { formatCurrency } from "@/utils/format";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { playSoundboxTone } from "@/utils/soundbox";
import {
  Plus,
  Search,
  X,
  BookOpen,
  UserPlus,
  QrCode,
  Zap,
  RotateCcw,
  Mic,
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

  // Express Quick Entry Modal state
  const [quickEntryVisible, setQuickEntryVisible] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<KhataCustomer | null>(null);

  // AI Voice Khata Modal state
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // 5-Second Floating Undo Banner State
  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    customer: KhataCustomer;
    amount: number;
    type: "CREDIT" | "PAYMENT";
    timer?: any;
  } | null>(null);

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

  const highDueCount = useMemo(() => {
    if (!customers) return 0;
    return customers.filter((c) => c.current_balance >= 2000).length;
  }, [customers]);

  const disputeCount = useMemo(() => {
    if (!customers) return 0;
    return customers.filter(
      (c) => (c as any).dispute_status === "PENDING" || (c as any).has_dispute
    ).length;
  }, [customers]);

  // Recent/Frequent active customers for 1-tap fast access
  const recentCustomers = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    return [...customers]
      .sort((a, b) => {
        const tA = new Date(a.last_activity_at || 0).getTime();
        const tB = new Date(b.last_activity_at || 0).getTime();
        return tB - tA;
      })
      .slice(0, 6);
  }, [customers]);

  // Search matches for instant Quick Udhar selection
  const searchMatches = useMemo(() => {
    if (!search || !customers) return [];
    const q = search.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.customer_name.toLowerCase().includes(q) ||
          c.customer_mobile.includes(q)
      )
      .slice(0, 3);
  }, [customers, search]);

  const handleOpenCustomer = (customer: KhataCustomer) => {
    setSelectedCustomer(customer);
    setPannaVisible(true);
  };

  const handleCustomerScanned = (scanned: { phone: string; name?: string }) => {
    setScannerVisible(false);
    const existing = customers?.find(
      (c) => c.customer_mobile === scanned.phone || c.customer_mobile.endsWith(scanned.phone)
    );
    if (existing) {
      setSelectedCustomer(existing);
      setPannaVisible(true);
    } else {
      const cleanMobile = scanned.phone.replace(/[^0-9]/g, "");
      const newCust: KhataCustomer = {
        id: "",
        customer_name: scanned.name || `Customer ${cleanMobile.slice(-4)}`,
        customer_mobile: cleanMobile.length === 10 ? cleanMobile : cleanMobile.slice(-10),
        credit_limit: 0,
        current_balance: 0,
        closure_status: "ACTIVE",
        last_activity_at: new Date().toISOString(),
      };
      setSelectedCustomer(newCust);
      setPannaVisible(true);
    }
  };

  // Launch express modal for specific customer
  const handleOpenQuickEntry = (cust: KhataCustomer) => {
    setQuickCustomer(cust);
    setQuickEntryVisible(true);
  };

  // Handle successful express entry with 5-second undo toast
  const handleQuickSuccess = (result: {
    customer: KhataCustomer;
    amount: number;
    type: "CREDIT" | "PAYMENT";
    isAutoOtp?: boolean;
  }) => {
    refetchCustomers();
    refetchAging();

    if (undoToast?.timer) {
      clearTimeout(undoToast.timer);
    }

    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 6000);

    setUndoToast({
      visible: true,
      customer: result.customer,
      amount: result.amount,
      type: result.type,
      timer,
    });
  };

  // Undo recent typo action
  const handlePerformUndo = async () => {
    if (!undoToast) return;
    const { customer, amount, type } = undoToast;
    setUndoToast(null);

    try {
      if (type === "CREDIT") {
        // Reverse credit by adding matching payment entry
        await apiClient.post(Endpoints.MERCHANT.KHATA_PAYMENT(customer.customer_mobile), {
          customer_name: customer.customer_name,
          amount: amount,
          payment_mode: "reversal",
          notes: "Auto-Undo typo mistake",
        });
      } else {
        // Reverse payment by re-adding credit
        await apiClient.post(Endpoints.MERCHANT.KHATA, {
          customer_name: customer.customer_name,
          customer_mobile: customer.customer_mobile,
          amount: amount,
          notes: "Auto-Undo payment typo",
        });
      }
      playSoundboxTone("reversal");
      Alert.alert("Undo Done", "Galti sudhar di gayi hai aur balance restore ho gaya hai.");
      refetchCustomers();
      refetchAging();
    } catch {
      Alert.alert("Error", "Undo nahi ho paya. Kripya passbook me jakar galti sudharein.");
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
            placeholder="Search customer by name or phone..."
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
          accessibilityLabel="Voice Khata"
          onPress={() => setVoiceModalVisible(true)}
          style={[
            styles.voiceBtn,
            {
              backgroundColor: isDark ? "#2e1065" : "#f5f3ff",
              borderColor: "#c4b5fd",
            },
          ]}
        >
          <Mic size={17} color="#7c3aed" />
          <Text style={styles.voiceBtnText}>Bol Kar</Text>
        </Pressable>

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

      {/* Instant Search Suggestions Box (If typing) */}
      {searchMatches.length > 0 && search.trim().length > 0 && (
        <View style={[styles.searchDropdown, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.dropdownLabel, { color: colors.textMuted }]}>
            ⚡ Instant Matches (Tap for Quick Udhar):
          </Text>
          {searchMatches.map((match) => (
            <Pressable
              key={match.id || match.customer_mobile}
              onPress={() => {
                setSearch("");
                handleOpenQuickEntry(match);
              }}
              style={styles.dropdownItem}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.matchName, { color: colors.text }]}>{match.customer_name}</Text>
                <Text style={[styles.matchPhone, { color: colors.textMuted }]}>📱 {match.customer_mobile}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.matchBal, { color: match.current_balance > 0 ? "#dc2626" : "#16a34a" }]}>
                  {formatCurrency(match.current_balance)}
                </Text>
                <View style={styles.quickEntryBadge}>
                  <Zap size={10} color="#fff" />
                  <Text style={styles.quickEntryBadgeText}>Quick Entry</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Recent / Frequent Customers 1-Tap Bar */}
      {recentCustomers.length > 0 && !search && (
        <View style={styles.recentWrap}>
          <Text style={[styles.recentLabel, { color: colors.textMuted }]}>⚡ Quick Pick Customer:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
            {recentCustomers.map((cust) => (
              <Pressable
                key={cust.id || cust.customer_mobile}
                onPress={() => handleOpenQuickEntry(cust)}
                style={[
                  styles.recentChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: cust.current_balance > 0 ? (isDark ? "#451a1a" : "#fecaca") : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>
                    {cust.customer_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                    {cust.customer_name}
                  </Text>
                  <Text style={[styles.recentBal, { color: cust.current_balance > 0 ? "#dc2626" : "#16a34a" }]}>
                    {formatCurrency(cust.current_balance)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

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
            ⏰ Due Today ({dueTodayCount})
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
            ⚠️ High Due &gt;₹2k ({highDueCount})
          </Text>
        </Pressable>

        {disputeCount > 0 && (
          <Pressable
            onPress={() => setActiveTab("DISPUTED")}
            style={[
              styles.tabBtn,
              activeTab === "DISPUTED"
                ? { backgroundColor: "#ef4444" }
                : { backgroundColor: colors.surface, borderColor: "#fecaca", borderWidth: 1 },
            ]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === "DISPUTED" ? "#fff" : "#ef4444" }]}>
              🚨 Disputed ({disputeCount})
            </Text>
          </Pressable>
        )}
      </View>

      {/* Khata Aging Recovery Analysis Header */}
      {aging && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <KhataAgingCard aging={aging} />
        </View>
      )}

      {/* Main Customers List */}
      {loadingCustomers ? (
        <LoadingState message="Bahi-Khata load ho raha hai..." />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id || item.customer_mobile}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <KhataCustomerCard
              customer={item}
              onRecordPayment={(cust) => handleOpenQuickEntry(cust)}
              onPressCard={(cust) => handleOpenCustomer(cust)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BookOpen size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {search ? "Koi customer nahi mila" : "Abhi koi Udhar Khata nahi hai"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {search
                  ? "Dusra naam ya phone number try karein ya naya panna banayein."
                  : "Upar diye gaye '+ Naya Panna' button ya '🎙️ Bol Kar' par tap karke customer ka udhar hisab shuru karein."}
              </Text>
            </View>
          }
          refreshing={loadingCustomers || loadingAging}
          onRefresh={handleRefresh}
        />
      )}

      {/* 5-Second Undo Toast Banner */}
      {!!undoToast && undoToast.visible && (
        <View style={styles.undoFloatingBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.undoTitle}>
              {undoToast.type === "CREDIT" ? "Udhar Darj Hua" : "Jama Darj Hua"} ✅
            </Text>
            <Text style={styles.undoSub} numberOfLines={1}>
              {undoToast.customer.customer_name}: {formatCurrency(undoToast.amount)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handlePerformUndo}
            style={styles.undoBtn}
          >
            <RotateCcw size={14} color="#f59e0b" />
            <Text style={styles.undoBtnText}>UNDO</Text>
          </Pressable>

          <Pressable onPress={() => setUndoToast(null)} style={{ padding: 4 }}>
            <X size={16} color="#94a3b8" />
          </Pressable>
        </View>
      )}

      {/* 🎙️ AI Voice Khata Modal */}
      <AIVoiceKhataModal
        visible={voiceModalVisible}
        customers={customers || []}
        onClose={() => setVoiceModalVisible(false)}
        onManualPrefill={(customer, type, amount, note) => {
          setQuickCustomer(customer);
          setQuickEntryVisible(true);
        }}
        onSuccess={(msg) => {
          playSoundboxTone("credit");
          Alert.alert("Success", msg);
          handleRefresh();
        }}
      />

      {/* ⚡ Express Quick Udhar Modal */}
      <ExpressQuickUdharModal
        visible={quickEntryVisible}
        customer={quickCustomer}
        onClose={() => {
          setQuickEntryVisible(false);
          setQuickCustomer(null);
        }}
        onSuccess={handleQuickSuccess}
      />

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
    paddingBottom: 6,
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
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 5,
  },
  voiceBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c3aed",
  },
  scanQrBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchDropdown: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 6,
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  matchName: {
    fontSize: 13,
    fontWeight: "800",
  },
  matchPhone: {
    fontSize: 11,
  },
  matchBal: {
    fontSize: 13,
    fontWeight: "800",
  },
  quickEntryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  quickEntryBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  recentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  recentScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  recentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentAvatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
  },
  recentName: {
    fontSize: 12,
    fontWeight: "700",
  },
  recentBal: {
    fontSize: 10,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  undoFloatingBanner: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  undoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  undoSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  undoBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#f59e0b",
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
