import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { Product } from "@/features/products/types";
import { InAppCameraModal } from "@/components/InAppCameraModal";
import {
  searchProductsByImage,
  VisualSearchOutput,
  VisualMatchResult,
} from "../services/visualProductMatcher";
import {
  Camera,
  Images,
  Sparkles,
  X,
  CheckCircle2,
  Tag,
  ChevronRight,
  RotateCcw,
} from "lucide-react-native";

interface VisualProductScannerModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: Product[];
  onSelectProduct: (product: Product) => void;
  onAddNewProductWithVisualCode?: (data: {
    name: string;
    category: string;
    visual_code: string;
    price?: number;
    photoUri?: string;
  }) => void;
}

export const VisualProductScannerModal: React.FC<VisualProductScannerModalProps> = ({
  visible,
  onClose,
  inventory,
  onSelectProduct,
}) => {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchOutput, setSearchOutput] = useState<VisualSearchOutput | null>(null);
  const [internalVisible, setInternalVisible] = useState(visible);
  const [cameraOpen, setCameraOpen] = useState(false);

  React.useEffect(() => {
    setInternalVisible(visible);
  }, [visible]);

  const resetState = useCallback(() => {
    setSelectedUri(null);
    setSearchOutput(null);
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
        setInternalVisible(true);
        const res = await searchProductsByImage(base64, inventory, mimeType);
        setSearchOutput(res);
      } catch (err: any) {
        setInternalVisible(true);
        Alert.alert(
          "Visual Scan Notice",
          err?.message || "Could not analyze product visual pattern. Please ensure the item is clearly in frame."
        );
      } finally {
        setIsScanning(false);
      }
    },
    [inventory]
  );

  // 📸 Use in-app camera to prevent Android system Activity kill
  const handleCamera = useCallback(() => {
    setInternalVisible(false);
    setCameraOpen(true);
  }, []);

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
          Alert.alert("Image Error", "Could not read image data.");
        }
      } else {
        setInternalVisible(true);
      }
    } catch (err: any) {
      setInternalVisible(true);
      Alert.alert("Gallery Error", err?.message || "Unable to open gallery.");
    }
  }, [processImage]);

  const handleChooseMatch = (match: VisualMatchResult) => {
    onSelectProduct(match.product);
    handleClose();
  };

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
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.sparkleCircle}>
                  <Sparkles size={18} color="#a78bfa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>AI Photo Product Search</Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Scan garment or packet photo — match inventory instantly
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Idle Action Tiles */}
              {!isScanning && !searchOutput && (
                <View style={styles.tilesBox}>
                  <Pressable
                    onPress={handleCamera}
                    style={({ pressed }) => [styles.tile, styles.tilePrimary, pressed && styles.tilePressed]}
                  >
                    <View style={styles.tileIconCircle}>
                      <Camera size={26} color="#fff" />
                    </View>
                    <Text style={styles.tileTitleWhite}>Take Photo</Text>
                    <Text style={styles.tileSubWhite}>Point camera at item{"\n"}under good light</Text>
                    <ChevronRight size={16} color="rgba(255,255,255,0.6)" style={styles.tileArrow} />
                  </Pressable>

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
                    <Text style={[styles.tileSub, { color: colors.textMuted }]}>Select existing photo</Text>
                    <ChevronRight size={16} color={colors.textMuted} style={styles.tileArrow} />
                  </Pressable>
                </View>
              )}

              {/* Scanning Indicator */}
              {isScanning && (
                <View style={styles.scanningBox}>
                  {selectedUri && <Image source={{ uri: selectedUri }} style={styles.previewImage} contentFit="cover" />}
                  <View style={styles.scanningIndicator}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={[styles.scanningTitle, { color: colors.text }]}>Analyzing Visual Fingerprint...</Text>
                    <Text style={[styles.scanningSub, { color: colors.textMuted }]}>
                      Generating visual code &amp; matching store inventory
                    </Text>
                  </View>
                </View>
              )}

              {/* Search Output Results */}
              {searchOutput && !isScanning && (
                <View style={styles.resultBox}>
                  <View style={[styles.codeBadgeCard, { backgroundColor: "rgba(124, 58, 237, 0.08)", borderColor: "#7c3aed" }]}>
                    <View style={styles.codeHeader}>
                      <Tag size={15} color="#7c3aed" />
                      <Text style={styles.codeTitle}>Visual Code:</Text>
                      <Text style={styles.codeValue}>{searchOutput.signature.visual_code}</Text>
                    </View>
                  </View>

                  <Text style={[styles.headingText, { color: colors.text }]}>
                    Matched Products ({searchOutput.matches.length}):
                  </Text>

                  {searchOutput.matches.length > 0 ? (
                    searchOutput.matches.map((item, idx) => (
                      <Pressable
                        key={item.product.id || idx}
                        onPress={() => handleChooseMatch(item)}
                        style={[styles.matchCard, { backgroundColor: bgColor, borderColor }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.matchTitle, { color: colors.text }]}>
                            {item.product.title || (item.product as any).name}
                          </Text>
                          <Text style={styles.matchReasonText}>🎯 {item.match_reason}</Text>
                          <Text style={[styles.matchPrice, { color: colors.primary }]}>
                            {formatCurrency(item.product.price)} • Stock: {item.product.stock ?? 99}
                          </Text>
                        </View>
                        <View style={styles.selectBadge}>
                          <CheckCircle2 size={16} color="#ffffff" />
                        </View>
                      </Pressable>
                    ))
                  ) : (
                    <View style={[styles.noMatchCard, { backgroundColor: "rgba(217, 119, 6, 0.08)" }]}>
                      <Text style={styles.noMatchTitle}>No Existing Product Matched in Store</Text>
                      <Text style={styles.noMatchDesc}>
                        Aapki dukaan ke catalog me yeh visual item abhi nahi hai. Mandi Khareed List me add karein taaki bazaar se mangwa sakein!
                      </Text>

                      <Button
                        title="📝 Add to Mandi Khareed List"
                        variant="primary"
                        size="md"
                        onPress={() => {
                          handleClose();
                          router.push("/merchant/procurement-list");
                        }}
                        style={{ marginTop: 8 }}
                      />
                    </View>
                  )}

                  <Pressable onPress={resetState} style={styles.retryBtn}>
                    <RotateCcw size={14} color={colors.textMuted} />
                    <Text style={[styles.retryText, { color: colors.textMuted }]}>Scan Another Photo</Text>
                  </Pressable>
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
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: "88%", paddingBottom: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e2e8f0" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  sparkleCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(124,58,237,0.12)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(100,116,139,0.1)", alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 14 },
  tilesBox: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, borderWidth: 1.5, borderRadius: 18, padding: 16, gap: 6, position: "relative", overflow: "hidden" },
  tilePrimary: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  tilePressed: { opacity: 0.85 },
  tileIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  tileTitleWhite: { fontSize: 14, fontWeight: "800", color: "#fff" },
  tileSubWhite: { fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 15 },
  tileTitle: { fontSize: 14, fontWeight: "800" },
  tileSub: { fontSize: 11, lineHeight: 15 },
  tileArrow: { position: "absolute", bottom: 14, right: 14 },
  scanningBox: { alignItems: "center", gap: 16, paddingVertical: 8 },
  previewImage: { width: 160, height: 160, borderRadius: 18 },
  scanningIndicator: { alignItems: "center", gap: 8 },
  scanningTitle: { fontSize: 15, fontWeight: "700" },
  scanningSub: { fontSize: 12 },
  resultBox: { gap: 12 },
  codeBadgeCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  codeHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeTitle: { fontSize: 12, fontWeight: "700" },
  codeValue: { fontSize: 12, fontWeight: "900", color: "#7c3aed" },
  headingText: { fontSize: 14, fontWeight: "800" },
  matchCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  matchTitle: { fontSize: 14, fontWeight: "800" },
  matchReasonText: { color: "#16a34a", fontSize: 11, fontWeight: "700", marginTop: 2 },
  matchPrice: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  selectBadge: { backgroundColor: "#7c3aed", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  noMatchCard: { borderRadius: 14, padding: 14, gap: 6 },
  noMatchTitle: { fontSize: 14, fontWeight: "800", color: "#b45309" },
  noMatchDesc: { fontSize: 12, color: "#b45309", lineHeight: 16 },
  retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  retryText: { fontSize: 12, fontWeight: "600" },
});
