import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Modal, Alert, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Camera, Image as ImageIcon, Plus, Trash2, X, Images } from "lucide-react-native";
import { resolveImageUrl } from "@/components/AppImage";

interface ProductMediaUploadSectionProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

const _ProductMediaUploadSection: React.FC<ProductMediaUploadSectionProps> = ({
  images,
  setImages,
}) => {
  const { colors, isDark } = useThemeColor();
  const [pickerVisible, setPickerVisible] = useState(false);

  const handlePickGallery = async () => {
    setPickerVisible(false);
    // Wait for modal to fully dismiss before launching gallery (prevents Android crash)
    await new Promise((resolve) => setTimeout(resolve, Platform.OS === "android" ? 350 : 200));
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Gallery access is needed to choose product photos. Please enable it in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        setImages((prev) => [...prev, ...newUris].slice(0, 4));
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err?.message || "Unable to open gallery. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    setPickerVisible(false);
    // Wait for modal to fully dismiss before launching camera (prevents Android crash)
    await new Promise((resolve) => setTimeout(resolve, Platform.OS === "android" ? 350 : 200));
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take product photos. Please enable it in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImages((prev) => [...prev, result.assets[0].uri].slice(0, 4));
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err?.message || "Unable to open camera. Please try again.");
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
            <Images size={16} color="#6366f1" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Product Photos (Max 4)</Text>
        </View>
        <Text style={[styles.count, { color: colors.textMuted }]}>{images.length}/4</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
        {images.length === 0 && (
          <Text style={[styles.placeholder, { color: colors.textMuted }]}>Tap "Add Photo" to upload product images</Text>
        )}
        {images.map((uri, idx) => (
          <View key={idx} style={styles.thumbWrap}>
            <Image source={{ uri: resolveImageUrl(uri) }} style={styles.thumb} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
              style={styles.deleteBadge}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={12} color="#fff" />
            </Pressable>
          </View>
        ))}

        {images.length < 4 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickerVisible(true)}
            style={[styles.addBtn, { backgroundColor: colors.background, borderColor: isDark ? "#3f3f46" : "#cbd5e1" }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={20} color="#6366f1" />
            <Text style={styles.addText}>Add Photo</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Upload Product Image</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <Pressable onPress={handleTakePhoto} style={[styles.optBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc" }]}>
              <Camera size={18} color="#6366f1" />
              <Text style={[styles.optText, { color: colors.text }]}>Take Photo with Camera</Text>
            </Pressable>

            <Pressable onPress={handlePickGallery} style={[styles.optBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc" }]}>
              <ImageIcon size={18} color="#10b981" />
              <Text style={[styles.optText, { color: colors.text }]}>Choose from Gallery</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export const ProductMediaUploadSection = React.memo(_ProductMediaUploadSection);

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontWeight: "700" },
  count: { fontSize: 11, fontWeight: "600" },
  imageRow: { gap: 10, paddingVertical: 2 },
  placeholder: { fontSize: 12, fontStyle: "italic", paddingVertical: 12 },
  thumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: "hidden", position: "relative" },
  thumb: { width: "100%", height: "100%" },
  deleteBadge: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 10, padding: 4 },
  addBtn: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 2 },
  addText: { fontSize: 10, fontWeight: "700", color: "#6366f1" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#ccc', marginVertical: 8 },
  modalTitle: { fontSize: 15, fontWeight: "700" },
  optBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10 },
  optText: { fontSize: 13, fontWeight: "600" },
});
