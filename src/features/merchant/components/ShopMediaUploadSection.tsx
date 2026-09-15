import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, Modal } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Camera, Image as ImageIcon, Plus, Trash2, RefreshCw, X, Sparkles } from "lucide-react-native";
import { resolveImageUrl } from "@/components/AppImage";

interface ShopMediaUploadSectionProps {
  logoUri: string;
  setLogoUri: (uri: string) => void;
  banners: string[];
  setBanners: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ShopMediaUploadSection: React.FC<ShopMediaUploadSectionProps> = ({
  logoUri,
  setLogoUri,
  banners,
  setBanners,
}) => {
  const { colors, isDark } = useThemeColor();
  const [pickerTarget, setPickerTarget] = useState<"logo" | "banner" | null>(null);

  const handlePickFromGallery = async () => {
    const target = pickerTarget;
    setPickerTarget(null);
    if (!target) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow access to your photo library in device settings.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: target === "logo" ? [1, 1] : [16, 9],
      quality: 0.85,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      if (target === "logo") {
        setLogoUri(res.assets[0].uri);
      } else {
        setBanners((prev) => [...prev, res.assets[0].uri]);
      }
    }
  };

  const handleTakePhoto = async () => {
    const target = pickerTarget;
    setPickerTarget(null);
    if (!target) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow camera access in device settings to take storefront photos.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: target === "logo" ? [1, 1] : [16, 9],
      quality: 0.85,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      if (target === "logo") {
        setLogoUri(res.assets[0].uri);
      } else {
        setBanners((prev) => [...prev, res.assets[0].uri]);
      }
    }
  };

  const handleOpenPicker = (target: "logo" | "banner") => {
    if (target === "banner" && banners.length >= 2) {
      Alert.alert("Limit Reached", "You can upload up to 2 shop banners.");
      return;
    }
    setPickerTarget(target);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconWrap, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
          <Camera size={18} color="#6366f1" />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Storefront Media & Branding
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Upload your shop signboard, counter & shelf photos
          </Text>
        </View>
      </View>

      {/* Dukan Logo / Avatar Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleOpenPicker("logo")}
            style={[
              styles.logoBox,
              {
                backgroundColor: colors.background,
                borderColor: logoUri ? "#6366f1" : colors.surfaceBorder,
              },
            ]}
          >
            {logoUri ? (
              <Image source={{ uri: resolveImageUrl(logoUri) }} style={styles.logoImg} contentFit="cover" />
            ) : (
              <View style={styles.placeholderCol}>
                <Camera size={22} color="#6366f1" />
                <Text style={[styles.logoText, { color: colors.textMuted }]}>Upload</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.logoHintCol}>
            <Text style={[styles.hintTitle, { color: colors.text }]}>
              Dukan Logo / Signboard
            </Text>
            <Text style={[styles.hintSub, { color: colors.textMuted }]}>
              Square 1:1 image shown in customer search & pickup notifications.
            </Text>

            <View style={styles.actionBtnRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleOpenPicker("logo")}
                style={[styles.smallBtn, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}
              >
                <RefreshCw size={11} color="#6366f1" />
                <Text style={styles.smallBtnText}>
                  {logoUri ? "Change Logo" : "Choose Logo"}
                </Text>
              </Pressable>

              {logoUri ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLogoUri("")}
                  style={[styles.smallBtn, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}
                >
                  <Trash2 size={11} color="#ef4444" />
                  <Text style={[styles.smallBtnText, { color: "#ef4444" }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* Shop Banners Section */}
      <View style={styles.bannerSection}>
        <View style={styles.bannerHeaderRow}>
          <Text style={[styles.bannerLabel, { color: colors.text }]}>
            Storefront Banners (Max 2)
          </Text>
          <Text style={[styles.bannerCount, { color: colors.textMuted }]}>
            {banners.length} of 2 uploaded
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerRow}
        >
          {banners.map((b, idx) => (
            <View key={idx} style={styles.bannerItem}>
              <Image source={{ uri: resolveImageUrl(b) }} style={styles.bannerImg} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                onPress={() => setBanners((prev) => prev.filter((_, i) => i !== idx))}
                style={styles.deleteBadge}
              >
                <Trash2 size={12} color="#fff" />
              </Pressable>
            </View>
          ))}

          {banners.length < 2 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => handleOpenPicker("banner")}
              style={[
                styles.addBannerBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: isDark ? "#3f3f46" : "#cbd5e1",
                },
              ]}
            >
              <Plus size={20} color="#6366f1" />
              <Text style={styles.addBannerText}>Add Banner</Text>
              <Text style={[styles.addBannerSub, { color: colors.textMuted }]}>16:9 Photo</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Image Source Selection Modal (Camera vs Gallery) */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerTarget(null)}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {pickerTarget === "logo" ? "Choose Store Logo Photo" : "Add Storefront Banner"}
              </Text>
              <Pressable onPress={() => setPickerTarget(null)} style={styles.modalClose}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.optionsList}>
              <Pressable
                accessibilityRole="button"
                onPress={handleTakePhoto}
                style={[
                  styles.optionBtn,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc" },
                ]}
              >
                <View style={[styles.optIconWrap, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
                  <Camera size={18} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optTitle, { color: colors.text }]}>Take Photo with Camera</Text>
                  <Text style={[styles.optSub, { color: colors.textMuted }]}>
                    Snap signboard, entrance or counter directly
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handlePickFromGallery}
                style={[
                  styles.optionBtn,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc" },
                ]}
              >
                <View style={[styles.optIconWrap, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                  <ImageIcon size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optTitle, { color: colors.text }]}>Choose from Gallery</Text>
                  <Text style={[styles.optSub, { color: colors.textMuted }]}>
                    Select saved high-resolution photo from device
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  logoSection: {
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  placeholderCol: {
    alignItems: "center",
    gap: 4,
  },
  logoText: {
    fontSize: 10,
    fontWeight: "700",
  },
  logoHintCol: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  hintSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 6,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366f1",
  },
  bannerSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 10,
  },
  bannerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  bannerCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  bannerRow: {
    gap: 10,
    paddingVertical: 4,
  },
  bannerItem: {
    width: 144,
    height: 86,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  bannerImg: {
    width: "100%",
    height: "100%",
  },
  deleteBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 12,
    padding: 5,
  },
  addBannerBtn: {
    width: 130,
    height: 86,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  addBannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366f1",
  },
  addBannerSub: {
    fontSize: 9,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  modalClose: {
    padding: 4,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  optIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  optSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
