import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useThemeColor } from "@/hooks/useThemeColor";
import { playSoundboxTone } from "@/utils/soundbox";
import { X, QrCode, Scan, ArrowRight, ShieldCheck } from "lucide-react-native";

interface KhataCustomerQRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onCustomerScanned: (customer: { phone: string; name?: string }) => void;
}

export const KhataCustomerQRScannerModal: React.FC<KhataCustomerQRScannerModalProps> = ({
  visible,
  onClose,
  onCustomerScanned,
}) => {
  const { colors, isDark } = useThemeColor();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasScanned(false);
      setManualPhone("");
      setManualName("");
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const parseCustomerQR = (data: string) => {
    try {
      const clean = data.trim();

      // Case 1: JSON payload
      if (clean.startsWith("{") && clean.endsWith("}")) {
        const parsed = JSON.parse(clean);
        if (parsed.phone) {
          return {
            phone: String(parsed.phone).replace(/[^0-9]/g, "").slice(-10),
            name: parsed.name || undefined,
          };
        }
      }

      // Case 2: URL scheme shopsilo://khata/customer?phone=...&name=...
      if (clean.includes("khata/customer") || clean.includes("phone=")) {
        const urlParams = new URLSearchParams(clean.split("?")[1] || clean);
        const phone = urlParams.get("phone");
        const name = urlParams.get("name");
        if (phone) {
          return {
            phone: phone.replace(/[^0-9]/g, "").slice(-10),
            name: name ? decodeURIComponent(name) : undefined,
          };
        }
      }

      // Case 3: Raw phone number (10 digits)
      const digits = clean.replace(/[^0-9]/g, "");
      if (digits.length >= 10) {
        return {
          phone: digits.slice(-10),
          name: undefined,
        };
      }
    } catch {
      // fallback
    }
    return null;
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return;
    const parsed = parseCustomerQR(data);
    if (parsed && parsed.phone.length === 10) {
      setHasScanned(true);
      playSoundboxTone("payment");
      onCustomerScanned(parsed);
      onClose();
    }
  };

  const handleManualSubmit = () => {
    const clean = manualPhone.replace(/[^0-9]/g, "");
    if (clean.length < 10) return;
    const phone = clean.slice(-10);
    playSoundboxTone("payment");
    onCustomerScanned({ phone, name: manualName.trim() || undefined });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <QrCode size={22} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Mera Khata QR Scan</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Customer ka passbook QR scan karein
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceBorder }]}
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Camera Viewfinder */}
          <View style={styles.cameraBox}>
            {Platform.OS !== "web" && permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
              />
            ) : (
              <View style={[styles.noCameraFallback, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <Scan size={44} color={colors.primary} />
                <Text style={[styles.fallbackTitle, { color: colors.text }]}>
                  {Platform.OS === "web" ? "Web Camera Scanner" : "Camera Access Needed"}
                </Text>
                <Text style={[styles.fallbackSub, { color: colors.textMuted }]}>
                  Niche diye input me customer ka number daalkar bhi panna khol sakte hain.
                </Text>
              </View>
            )}

            {/* Target Reticle */}
            <View style={styles.reticleOverlay}>
              <View style={styles.reticleBox} />
            </View>
          </View>

          {/* Quick Manual Entry Form */}
          <View style={styles.manualSection}>
            <Text style={[styles.manualLabel, { color: colors.textMuted }]}>
              Ya Mobile Number se turant panna kholein:
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.phoneInput,
                  { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background },
                ]}
                placeholder="10-digit Mobile Number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={manualPhone}
                onChangeText={setManualPhone}
              />
              <Pressable
                accessibilityRole="button"
                onPress={handleManualSubmit}
                disabled={manualPhone.replace(/[^0-9]/g, "").length < 10}
                style={[
                  styles.goBtn,
                  {
                    backgroundColor:
                      manualPhone.replace(/[^0-9]/g, "").length >= 10 ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <ArrowRight size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Footer note */}
          <View style={styles.footerNote}>
            <ShieldCheck size={14} color="#16a34a" />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Customer ka panna bina number type kiye &lt; 1 sec me khulega.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBox: {
    height: 260,
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
  },
  noCameraFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  fallbackSub: {
    fontSize: 13,
    textAlign: "center",
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  reticleBox: {
    width: 180,
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.08)",
  },
  manualSection: {
    padding: 20,
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  goBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
  },
});
