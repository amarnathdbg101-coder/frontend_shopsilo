import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { InAppCameraModal } from "@/components/InAppCameraModal";
import {
  scanProductWithAI,
  ScannedProductData,
} from "../services/aiProductScanner";
import {
  Camera,
  Images,
  Sparkles,
  X,
  CheckCircle2,
  Tag,
  Package,
  RotateCcw,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";

interface AIScanProductModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (data: ScannedProductData, photoUri?: string) => void;
}

// ─── Key Fix ──────────────────────────────────────────────────────────────────
// On Android, launching the camera while a Modal is mounted can cause the OS
// to kill the Expo/React Native process (the camera activity sits on top of the
// modal activity and the OS reclaims memory from the background app).
//
// Solution:
//   1. Close the modal (visible = false) → wait 300 ms for animation to finish.
//   2. Launch the camera (no modal is alive at this point).
//   3. When the camera returns, call onReady(result) which re-opens the modal
//      and starts processing.
// ─────────────────────────────────────────────────────────────────────────────

export const AIScanProductModal: React.FC<AIScanProductModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const { colors, isDark } = useThemeColor();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedProductData | null>(null);
  const [internalVisible, setInternalVisible] = useState(visible);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Sync external visibility changes
  React.useEffect(() => {
    setInternalVisible(visible);
  }, [visible]);

  const resetState = useCallback(() => {
    setSelectedUri(null);
    setScannedData(null);
    setIsScanning(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    setInternalVisible(false);
    onClose();
  }, [onClose, resetState]);

  const processImage = useCallback(
    async (base64: string, uri: string, mimeType: string = "image/jpeg") => {
      try {
        setIsScanning(true);
        setSelectedUri(uri);
        setInternalVisible(true); // re-open modal to show scanning state
        const data = await scanProductWithAI(base64, mimeType);
        setScannedData(data);
      } catch (err: any) {
        Alert.alert(
          "Scan Incomplete",
          err?.message || "Packet details could not be detected. Please ensure the packet is in good light and in focus."
        );
        setInternalVisible(true); // re-open to allow retry
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  // ── Camera: use in-app camera, no system Activity (fixes Android restart) ──
  const handleCamera = useCallback(() => {
    setInternalVisible(false);
    setCameraOpen(true);
  }, []);

  // Called when InAppCameraModal captures a photo
  const handleCameraCapture = useCallback(
    async (uri: string, directBase64?: string) => {
      setCameraOpen(false);
      try {
        let base64 = directBase64;
        if (!base64) {
          base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
        await processImage(base64, uri, "image/jpeg");
      } catch (err: any) {
        setInternalVisible(true);
        Alert.alert("Image Error", err?.message || "Could not read captured image.");
      }
    },
    [processImage]
  );

  const handleGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Gallery Permission Required",
          "ShopSilo needs gallery access to select product photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // Close modal before launching gallery picker (same precaution as camera)
      setInternalVisible(false);
      await new Promise((resolve) =>
        setTimeout(resolve, Platform.OS === "android" ? 350 : 200)
      );

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.65,
        base64: true,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          await processImage(asset.base64, asset.uri, asset.mimeType || "image/jpeg");
        } else {
          setInternalVisible(true);
          Alert.alert("Image Error", "Could not read image data. Please try again.");
        }
      } else {
        setInternalVisible(true);
      }
    } catch (err: any) {
      setInternalVisible(true);
      Alert.alert("Gallery Error", err?.message || "Unable to open gallery. Please try again.");
    }
  }, [processImage]);

  const handleApply = useCallback(() => {
    if (!scannedData) return;
    onApply(scannedData, selectedUri || undefined);
    handleClose();
  }, [scannedData, selectedUri, onApply, handleClose]);

  const surfaceColor = isDark ? "#131b2e" : "#ffffff";
  const bgColor = isDark ? "#090d16" : "#f8fafc";
  const borderColor = isDark ? "#1e293b" : "#e2e8f0";

  return (
    <>
      <Modal
        visible={internalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View style={[styles.sheet, { backgroundColor: surfaceColor, borderColor }]}>
            {/* ── Header ── */}
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.sparkleCircle}>
                  <Sparkles size={18} color="#a78bfa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>AI Packet Scanner</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Snap a photo — auto-fill all product details instantly
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              bounces={false}
            >
              {/* ── Action Tiles (idle state) ── */}
              {!isScanning && !scannedData && (
                <View style={styles.tilesBox}>
                  {/* Camera tile */}
                  <Pressable
                    onPress={handleCamera}
                    style={({ pressed }) => [
                      styles.tile,
                      styles.tilePrimary,
                      pressed && styles.tilePressed,
                    ]}
                  >
                    <View style={styles.tileIconCircle}>
                      <Camera size={26} color="#fff" />
                    </View>
                    <Text style={styles.tileTitleWhite}>Take Photo</Text>
                    <Text style={styles.tileSubWhite}>Hold packet close{"\n"}under good light</Text>
                    <ChevronRight size={16} color="rgba(255,255,255,0.6)" style={styles.tileArrow} />
                  </Pressable>

                  {/* Gallery tile */}
                  <Pressable
                    onPress={handleGallery}
                    style={({ pressed }) => [
                      styles.tile,
                      { backgroundColor: bgColor, borderColor },
                      pressed && styles.tilePressed,
                    ]}
                  >
                    <View style={[styles.tileIconCircle, { backgroundColor: "rgba(99,102,241,0.15)" }]}>
                      <Images size={26} color={colors.primary} />
                    </View>
                    <Text style={[styles.tileTitle, { color: colors.text }]}>From Gallery</Text>
                    <Text style={[styles.tileSub, { color: colors.textMuted }]}>
                      Select an existing{"\n"}packaging photo
                    </Text>
                    <ChevronRight size={16} color={colors.textMuted} style={styles.tileArrow} />
                  </Pressable>
                </View>
              )}

              {/* ── Scanning indicator ── */}
              {isScanning && (
                <View style={styles.scanningBox}>
                  {selectedUri && (
                    <Image
                      source={{ uri: selectedUri }}
                      style={styles.previewImage}
                      contentFit="cover"
                    />
                  )}
                  <View style={styles.scanningIndicator}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={[styles.scanningTitle, { color: colors.text }]}>
                      Analyzing with Gemini Vision...
                    </Text>
                    <Text style={[styles.scanningSub, { color: colors.textMuted }]}>
                      Detecting brand, MRP, weight, category &amp; ingredients
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Result card ── */}
              {scannedData && !isScanning && (
                <View style={styles.resultBox}>
                  <View style={styles.successBadge}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <Text style={styles.successBadgeText}>Packet analyzed successfully!</Text>
                  </View>

                  {selectedUri && (
                    <Image
                      source={{ uri: selectedUri }}
                      style={styles.resultThumb}
                      contentFit="cover"
                    />
                  )}

                  <View style={[styles.detailCard, { backgroundColor: bgColor, borderColor }]}>
                    <Text style={[styles.resName, { color: colors.text }]}>{scannedData.name}</Text>
                    {scannedData.brand && (
                      <Text style={[styles.resBrand, { color: colors.primary }]}>
                        {scannedData.brand}
                      </Text>
                    )}

                    <View style={styles.chipsRow}>
                      <View style={[styles.chip, { backgroundColor: "rgba(234,88,12,0.1)" }]}>
                        <Tag size={12} color="#ea580c" />
                        <Text style={[styles.chipText, { color: "#ea580c" }]}>
                          MRP: ₹{scannedData.mrp || "N/A"}
                        </Text>
                      </View>
                      {scannedData.weight && (
                        <View style={[styles.chip, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
                          <Package size={12} color="#2563eb" />
                          <Text style={[styles.chipText, { color: "#2563eb" }]}>
                            {scannedData.weight}{scannedData.unit || "g"}
                          </Text>
                        </View>
                      )}
                      {scannedData.category_hint && (
                        <View style={[styles.chip, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9" }]}>
                          <Text style={[styles.chipText, { color: colors.textMuted }]}>
                            {scannedData.category_hint}
                          </Text>
                        </View>
                      )}
                    </View>

                    {scannedData.description && (
                      <Text numberOfLines={2} style={[styles.resDesc, { color: colors.textMuted }]}>
                        {scannedData.description}
                      </Text>
                    )}
                  </View>

                  <View style={styles.resultActions}>
                    <Button
                      title="Autofill All Fields ✨"
                      size="lg"
                      variant="primary"
                      leftIcon={<Sparkles size={16} color="#ffffff" />}
                      onPress={handleApply}
                      style={styles.applyBtn}
                    />
                    <Pressable onPress={resetState} style={styles.retryBtn}>
                      <RotateCcw size={14} color={colors.textMuted} />
                      <Text style={[styles.retryText, { color: colors.textMuted }]}>
                        Scan Another
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* ── Tip ── */}
              {!isScanning && !scannedData && (
                <View style={[styles.tipBox, { backgroundColor: isDark ? "rgba(124,58,237,0.1)" : "#f5f3ff", borderColor: isDark ? "rgba(124,58,237,0.2)" : "#e9d5ff" }]}>
                  <AlertCircle size={14} color="#7c3aed" />
                  <Text style={styles.tipText}>
                    Tip: Place packet on a flat surface under bright light for best results
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* In-app camera — avoids launching system Activity on Android */}
      <InAppCameraModal
        visible={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setInternalVisible(true);
        }}
        onCapture={handleCameraCapture}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: "88%",
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sparkleCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(124,58,237,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(100,116,139,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 16 },

  // ── Tiles ──
  tilesBox: { flexDirection: "row", gap: 12 },
  tile: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  tilePrimary: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  tilePressed: { opacity: 0.85 },
  tileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tileTitleWhite: { fontSize: 14, fontWeight: "800", color: "#fff" },
  tileSubWhite: { fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 15 },
  tileTitle: { fontSize: 14, fontWeight: "800" },
  tileSub: { fontSize: 11, lineHeight: 15 },
  tileArrow: { position: "absolute", bottom: 14, right: 14 },

  // ── Scanning ──
  scanningBox: { alignItems: "center", gap: 16, paddingVertical: 8 },
  previewImage: { width: 160, height: 160, borderRadius: 18 },
  scanningIndicator: { alignItems: "center", gap: 8 },
  scanningTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  scanningSub: { fontSize: 12, textAlign: "center", lineHeight: 18 },

  // ── Result ──
  resultBox: { gap: 14 },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  successBadgeText: { color: "#15803d", fontSize: 13, fontWeight: "700" },
  resultThumb: { width: "100%", height: 160, borderRadius: 16 },
  detailCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  resName: { fontSize: 16, fontWeight: "800" },
  resBrand: { fontSize: 13, fontWeight: "600" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: "700" },
  resDesc: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  resultActions: { gap: 10 },
  applyBtn: { backgroundColor: "#7c3aed" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  retryText: { fontSize: 13, fontWeight: "600" },

  // ── Tip ──
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 12, color: "#7c3aed", lineHeight: 17, fontWeight: "500" },
});
