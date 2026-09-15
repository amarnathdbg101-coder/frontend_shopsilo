/**
 * ============================================================================
 * 📌 WHAT: In-App Camera Modal with Native Downsampling & Base64 Compression.
 * ⚙️ HOW: Renders `CameraView` from `expo-camera` inside an in-app React Native Modal.
 *         On shutter press, `takePictureAsync` captures photo with native quality: 0.3
 *         producing a lightweight ~150KB base64 string directly passed to caller.
 * 🎯 WHY: Solves the Android OS Activity restart crash when opening system camera
 *         over a modal and eliminates out-of-memory errors on Gemini Vision API.
 * 🔄 ALTERNATIVE: `ImagePicker.launchCameraAsync` launches a separate Android Activity,
 *               causing Android OS to suspend/kill the background React Native app.
 * 📍 WHERE: `src/components/InAppCameraModal.tsx` • Used in Photo Search & Packet Auto-Scan.
 * ============================================================================
 */
import React, { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { X, Camera, RefreshCw, ZapOff } from "lucide-react-native";

interface InAppCameraModalProps {
  visible: boolean;
  onClose: () => void;
  /** Returns the local URI and optional direct compressed base64 of the captured photo */
  onCapture: (uri: string, base64?: string) => void;
}

export const InAppCameraModal: React.FC<InAppCameraModalProps> = ({
  visible,
  onClose,
  onCapture,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [isTaking, setIsTaking] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    try {
      setIsTaking(true);
      // Native downsampling & compression to ~150KB prevents Android OOM memory limit rejection
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: true,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri, photo.base64 || undefined);
        onClose();
      }
    } catch (err: any) {
      console.warn("[InAppCamera] Capture error:", err);
      Alert.alert("Camera Notice", err?.message || "Could not capture photo. Please try again.");
    } finally {
      setIsTaking(false);
    }
  }, [isTaking, onCapture, onClose]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  if (!visible) return null;

  // Permission not yet determined
  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <ZapOff size={40} color="#7c3aed" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>
              ShopSilo needs camera access to scan product packets. Please grant permission to continue.
            </Text>
            <Pressable style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
            </Pressable>
            <Pressable style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color="#fff" />
            </Pressable>
            <Text style={styles.topTitle}>Scan Product Packet</Text>
            <Pressable onPress={toggleFacing} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <RefreshCw size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Scan guide overlay */}
          <View style={styles.guideOverlay}>
            <View style={styles.guideBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.guideText}>
              Point at product packet label
            </Text>
          </View>

          {/* Shutter */}
          <View style={styles.bottomBar}>
            <Pressable
              onPress={handleCapture}
              disabled={isTaking}
              style={({ pressed }) => [
                styles.shutterOuter,
                pressed && { opacity: 0.8 },
              ]}
            >
              {isTaking ? (
                <ActivityIndicator color="#7c3aed" size="small" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 58 : 40,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  guideOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  guideBox: {
    width: 240,
    height: 240,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#a78bfa",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  guideText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  bottomBar: {
    paddingBottom: Platform.OS === "ios" ? 48 : 36,
    paddingTop: 24,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },

  permissionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  permissionCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  permissionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", textAlign: "center" },
  permissionSub: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  grantBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  grantBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  cancelLink: { paddingVertical: 10 },
  cancelLinkText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
});
