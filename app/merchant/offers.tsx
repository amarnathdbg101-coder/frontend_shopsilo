import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMyShop } from "@/features/merchant/api/useMerchantStore";
import {
  useShopOffers,
  useUpdateOffer,
  useDeleteOffer,
  useOfferHistory,
  OfferAuditRecord,
} from "@/features/merchant/api/useOffers";
import { OfferItemCard } from "@/features/merchant/components/OfferItemCard";
import { CreateOfferModal } from "@/features/merchant/components/CreateOfferModal";
import { ShopOffer } from "@/features/merchant/types";
import { Sparkles, Plus, Tag, Megaphone, Clock, History, X } from "lucide-react-native";

export default function OffersScreen() {
  const { colors } = useThemeColor();
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Edit Offer Modal State
  const [editingOffer, setEditingOffer] = useState<ShopOffer | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDiscountText, setEditDiscountText] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: shop } = useMyShop();
  const {
    data: offers = [],
    isLoading,
    refetch,
    isRefetching,
  } = useShopOffers(shop?.slug);

  const { data: auditHistory = [] } = useOfferHistory(historyModalOpen);
  const updateOfferMutation = useUpdateOffer();
  const deleteOfferMutation = useDeleteOffer();

  const handleOpenEdit = (offer: ShopOffer) => {
    setEditingOffer(offer);
    setEditTitle(offer.title);
    setEditDiscountText(offer.discount_text);
    setEditDescription(offer.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingOffer) return;
    if (!editTitle.trim() || !editDiscountText.trim()) {
      return Alert.alert("Required Fields", "Title and Discount text are required.");
    }

    updateOfferMutation.mutate(
      {
        id: editingOffer.id,
        title: editTitle.trim(),
        discount_text: editDiscountText.trim(),
        description: editDescription.trim(),
        min_points_required: editingOffer.min_points_required || 0,
      },
      {
        onSuccess: () => {
          Alert.alert("Offer Updated 📝", "Offer updated and recorded in database audit track!");
          setEditingOffer(null);
          refetch();
        },
        onError: (err: any) => {
          Alert.alert("Update Failed", err?.message || "Could not update offer.");
        },
      }
    );
  };

  const handleDelete = (offer: ShopOffer) => {
    Alert.alert(
      "Confirm Delete Offer",
      `Are you sure you want to delete "${offer.title}"? This action will be recorded in database audit track.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Offer",
          style: "destructive",
          onPress: () => {
            deleteOfferMutation.mutate(offer.id, {
              onSuccess: () => {
                Alert.alert("Offer Deleted 🗑️", "Offer deleted and logged in audit track!");
                refetch();
              },
              onError: (err: any) => {
                Alert.alert("Delete Failed", err?.message || "Could not delete offer.");
              },
            });
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Promotional Hero Banner */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: "rgba(79, 70, 229, 0.08)",
              borderColor: "rgba(79, 70, 229, 0.2)",
            },
          ]}
        >
          <View style={styles.heroHeader}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Attract Nearby Walk-In Shoppers
            </Text>
          </View>
          <Text style={[styles.heroText, { color: colors.textMuted }]}>
            Publish a discount or festival deal. Nearby customers see live offers on your shop page. Every edit & deletion is recorded in database audit history.
          </Text>

          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setModalVisible(true)}
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.createBtnText}>Create New Offer</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setHistoryModalOpen(true)}
              style={[styles.historyBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <History size={15} color={colors.text} />
              <Text style={[styles.historyBtnText, { color: colors.text }]}>Audit History Log</Text>
            </Pressable>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.headingRow}>
          <Text style={[styles.heading, { color: colors.text }]}>
            Live Shop Offers ({offers.length})
          </Text>
        </View>

        {isLoading ? (
          <LoadingState message="Checking running offers..." />
        ) : offers.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.emptyIconWrap}>
              <Megaphone size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No live offers right now
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Shops with running deals show up prominently in customer Deals feed.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setModalVisible(true)}
              style={[styles.firstOfferBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.firstOfferText}>Create Your First Offer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.offersList}>
            {offers.map((offer: ShopOffer) => (
              <OfferItemCard
                key={offer.id}
                offer={offer}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Offer Modal */}
      <CreateOfferModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Offer Modal */}
      <Modal visible={!!editingOffer} transparent animationType="fade" onRequestClose={() => setEditingOffer(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingOffer(null)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Offer Details ✏️</Text>
              <Pressable onPress={() => setEditingOffer(null)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Offer Title (e.g. Festival Special Discount)"
              placeholderTextColor={colors.textMuted}
              value={editTitle}
              onChangeText={setEditTitle}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Discount Text (e.g. FLAT 20% OFF)"
              placeholderTextColor={colors.textMuted}
              value={editDiscountText}
              onChangeText={setEditDiscountText}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Description / Terms (optional)"
              placeholderTextColor={colors.textMuted}
              value={editDescription}
              onChangeText={setEditDescription}
            />

            <Button
              title={updateOfferMutation.isPending ? "Saving Changes..." : "Update Offer & Record Audit"}
              variant="primary"
              size="md"
              isLoading={updateOfferMutation.isPending}
              onPress={handleSaveEdit}
              style={{ marginTop: 6 }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Database Audit History Log Modal */}
      <Modal visible={historyModalOpen} transparent animationType="slide" onRequestClose={() => setHistoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440, maxHeight: "80%", backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <History size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Database Offer Audit History Log</Text>
              </View>
              <Pressable onPress={() => setHistoryModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {auditHistory.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 20 }}>
                  No audit history records found yet.
                </Text>
              ) : (
                auditHistory.map((rec: OfferAuditRecord) => (
                  <View key={rec.id} style={[styles.auditCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                    <View style={styles.auditHeader}>
                      <View style={[
                        styles.actionBadge,
                        { backgroundColor: rec.action === "CREATED" ? "#dcfce7" : rec.action === "UPDATED" ? "#dbeafe" : "#fee2e2" }
                      ]}>
                        <Text style={[
                          styles.actionBadgeText,
                          { color: rec.action === "CREATED" ? "#16a34a" : rec.action === "UPDATED" ? "#2563eb" : "#dc2626" }
                        ]}>
                          {rec.action}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {new Date(rec.created_at).toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                      Title: {rec.new_title || rec.previous_title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      Deal: {rec.new_discount_text || rec.previous_discount_text}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 14 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 16, fontWeight: "800" },
  heroText: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  heroActions: { flexDirection: "row", gap: 8 },
  createBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  historyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  createBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  historyBtnText: { fontSize: 12, fontWeight: "700" },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heading: { fontSize: 15, fontWeight: "800" },
  offersList: { gap: 4 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  firstOfferBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  firstOfferText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 380, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 15, fontWeight: "800" },
  input: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13 },
  auditCard: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 2 },
  auditHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actionBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  actionBadgeText: { fontSize: 10, fontWeight: "800" },
});
