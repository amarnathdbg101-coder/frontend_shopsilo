import React, { useState, useEffect } from "react";
import { Modal, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { Button } from "@/components/Button";
import { AddAddressForm } from "@/features/profile/components/AddAddressForm";
import { useAddressStore, AddressItem } from "@/store/useAddressStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, MapPin, Home, Briefcase, Plus, CheckCircle2, Trash2 } from "lucide-react-native";

interface AddressesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddressesModal: React.FC<AddressesModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();
  const { addresses, addAddress, removeAddress, setDefaultAddress, hydrate } = useAddressStore();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleSaveNew = async (data: Omit<AddressItem, "id">) => {
    await addAddress(data);
    setShowAddForm(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Saved Addresses</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {showAddForm ? (
              <AddAddressForm onSave={handleSaveNew} onCancel={() => setShowAddForm(false)} />
            ) : (
              <>
                {addresses.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No addresses saved yet.</Text>
                ) : (
                  addresses.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setDefaultAddress(item.id)}
                      style={[
                        styles.addressCard,
                        { backgroundColor: colors.background, borderColor: item.isDefault ? colors.primary : colors.surfaceBorder },
                      ]}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.typeBadge}>
                          {item.type === "Home" ? <Home size={13} color="#2563eb" /> : item.type === "Work" ? <Briefcase size={13} color="#059669" /> : <MapPin size={13} color="#ea580c" />}
                          <Text style={styles.typeText}>{item.type}</Text>
                        </View>
                        <View style={styles.rightActions}>
                          {item.isDefault && (
                            <View style={styles.defaultBadge}>
                              <CheckCircle2 size={12} color="#16a34a" />
                              <Text style={styles.defaultText}>Default</Text>
                            </View>
                          )}
                          <Pressable onPress={() => removeAddress(item.id)} style={styles.deleteBtn}>
                            <Trash2 size={14} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                      <Text style={[styles.streetText, { color: colors.text }]}>{item.street}</Text>
                      <Text style={[styles.cityText, { color: colors.textMuted }]}>
                        {item.city} {item.pincode ? `• ${item.pincode}` : ""}
                      </Text>
                    </Pressable>
                  ))
                )}

                <Button
                  title="Add New Address"
                  variant="outline"
                  onPress={() => setShowAddForm(true)}
                  leftIcon={<Plus size={16} color={colors.primary} />}
                  style={styles.addBtn}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, maxHeight: "82%", borderRadius: 20, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  content: { gap: 10 },
  emptyText: { textAlign: "center", paddingVertical: 14 },
  addressCard: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  typeText: { fontSize: 12, fontWeight: "800" },
  rightActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  defaultBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  defaultText: { fontSize: 10, fontWeight: "800", color: "#16a34a" },
  deleteBtn: { padding: 4 },
  streetText: { fontSize: 13, fontWeight: "600" },
  cityText: { fontSize: 12 },
  addBtn: { marginTop: 4 },
});
