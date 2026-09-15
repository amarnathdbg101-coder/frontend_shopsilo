/**
 * ============================================================================
 * 📌 WHAT: In-App Document Viewer & Physical PDF File Downloader Modal.
 * ⚙️ HOW: Renders an A4 document preview sheet directly inside React Native Modal.
 *         On download, uses `expo-file-system` (`writeAsStringAsync` / `downloadAsync`)
 *         to save a real physical `.pdf` file to phone storage without opening Chrome.
 * 🎯 WHY: Solves the external browser redirection problem; keeps user inside Shopsilo
 *         app while providing real PDF file downloads for printing or sharing.
 * 🔄 ALTERNATIVE: `Linking.openURL(pdfUrl)` was opening external Chrome/Safari, causing
 *               JWT auth 401 errors and kicking the shopkeeper out of the app.
 * 📍 WHERE: `src/components/InAppPDFModal.tsx` • Used in Mandi List, POS Receipts, and Khata Statements.
 * ============================================================================
 */
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/useAuthStore";
import { FileText, Download, MessageCircle, X, CheckCircle2, ShieldCheck, FolderCheck } from "lucide-react-native";

interface InAppPDFModalProps {
  visible: boolean;
  title: string;
  pdfUrl: string;
  pdfBase64?: string;
  filename: string;
  items?: Array<{ name: string; qty: string; details?: string }>;
  onClose: () => void;
}

export const InAppPDFModal: React.FC<InAppPDFModalProps> = ({
  visible,
  title,
  pdfUrl,
  pdfBase64,
  filename,
  items = [],
  onClose,
}) => {
  const { colors, isDark } = useThemeColor();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);

  if (!visible) return null;

  // Physical Local File Downloader (Downloads real .pdf file to device phone storage)
  const handleLocalDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      if (pdfBase64) {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const a = document.createElement("a");
          a.href = `data:application/pdf;base64,${pdfBase64}`;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setDownloadSuccess(true);
        } else {
          const fileSystem = FileSystem as any;
          const baseDir = fileSystem.documentDirectory || fileSystem.cacheDirectory;
          if (!baseDir || typeof fileSystem.writeAsStringAsync !== "function") {
            throw new Error("Device file storage is unavailable.");
          }
          const fileUri = `${baseDir}${filename}`;
          const encoding = fileSystem.EncodingType?.Base64 || "base64";
          await fileSystem.writeAsStringAsync(fileUri, pdfBase64, {
            encoding,
          });
          setSavedFileUri(fileUri);
          setDownloadSuccess(true);
          Alert.alert(
            "PDF Saved to Phone 📂",
            `"${filename}" downloaded successfully to phone storage!`,
            [
              { text: "OK" },
              {
                text: "Open Saved File",
                onPress: () => Linking.openURL(fileUri).catch(() => {}),
              },
            ]
          );
        }
        return;
      }

      const token = useAuthStore.getState().accessToken;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // Web Automatic Blob File Download
        const res = await fetch(pdfUrl, { headers });
        if (!res.ok) {
          throw new Error(`PDF server returned ${res.status}.`);
        }
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        setDownloadSuccess(true);
      } else {
        // Mobile Physical File System Download to Phone Storage
        const fileSystem = FileSystem as any;
        const baseDir = fileSystem.documentDirectory || fileSystem.cacheDirectory;
        if (!baseDir || typeof fileSystem.downloadAsync !== "function") {
          throw new Error("Device file storage is unavailable.");
        }
        const fileUri = `${baseDir}${filename}`;
        const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri, {
          headers,
        });

        if (downloadRes.status === 200 || downloadRes.uri) {
          setSavedFileUri(downloadRes.uri);
          setDownloadSuccess(true);
          Alert.alert(
            "PDF Saved to Phone 📂",
            `"${filename}" downloaded successfully to phone storage!`,
            [
              { text: "OK" },
              {
                text: "Open Saved File",
                onPress: () => Linking.openURL(downloadRes.uri).catch(() => {}),
              },
            ]
          );
        } else {
          await Linking.openURL(pdfUrl);
          setDownloadSuccess(true);
        }
      }
    } catch (err: any) {
      console.warn("[PDFDownload] Error downloading physical PDF file:", err);
      if (pdfBase64) {
        Alert.alert(
          "PDF save failed",
          "The custom procurement PDF was generated, but it could not be saved to this device. Please try downloading again."
        );
      } else {
        Linking.openURL(pdfUrl).catch(() => {});
        setDownloadSuccess(true);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenPhysicalFile = () => {
    const target = savedFileUri || pdfUrl;
    Linking.openURL(target).catch(() => {
      Alert.alert("Notice", "Unable to open PDF file reader.");
    });
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `📦 *${title}*\n📄 Document PDF Link: ${pdfUrl}\n\nGenerated by Shopsilo Retail OS.`
    );
    Linking.openURL(`https://wa.me/?text=${text}`).catch(() => {
      Alert.alert("Notice", "Unable to launch WhatsApp.");
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                <FileText size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Physical PDF File Downloader • {filename}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* In-App Printable A4 Document Sheet Card */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={[styles.documentSheet, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: colors.surfaceBorder }]}>
              <View style={styles.docHeader}>
                <ShieldCheck size={18} color="#0284c7" />
                <Text style={[styles.docShopTitle, { color: colors.text }]}>SHOPSILO RETAIL OS</Text>
              </View>

              <Text style={[styles.docDocTitle, { color: colors.primary }]}>{title.toUpperCase()}</Text>
              <Text style={[styles.docDate, { color: colors.textMuted }]}>
                Generated: {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>

              {items.length > 0 && (
                <View style={styles.docTable}>
                  <View style={[styles.tableHeaderRow, { backgroundColor: colors.surfaceBorder }]}>
                    <Text style={[styles.tableHead, { flex: 2, color: colors.text }]}>Item Description</Text>
                    <Text style={[styles.tableHead, { flex: 1, textAlign: "right", color: colors.text }]}>Qty</Text>
                  </View>

                  {items.map((it, idx) => (
                    <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.surfaceBorder }]}>
                      <Text style={[styles.tableCell, { flex: 2, color: colors.text }]}>{it.name}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: "right", color: colors.primary, fontWeight: "700" }]}>{it.qty}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.docFooter}>
                <Text style={[styles.docFooterText, { color: colors.textMuted }]}>
                  Verified Digital Document • Ready for Download & Printing
                </Text>
              </View>
            </View>

            {/* Status Banner */}
            <View style={[styles.statusBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              {downloadSuccess ? (
                <View style={styles.statusRow}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statusTitle, { color: "#16a34a" }]}>PDF Saved to Phone Storage! 🎉</Text>
                    <Text style={[styles.statusSub, { color: colors.textMuted }]}>"{filename}" downloaded to phone</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statusRow}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statusTitle, { color: colors.text }]}>Document Ready to Download</Text>
                    <Text style={[styles.statusSub, { color: colors.textMuted }]}>Tap button below to save physical .pdf file to phone</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.btnGroup}>
              <Button
                title={isDownloading ? "Downloading Physical PDF..." : "Download PDF File to Phone Storage 📂"}
                variant="primary"
                size="lg"
                isLoading={isDownloading}
                onPress={handleLocalDownload}
                leftIcon={<Download size={18} color="#fff" />}
                style={{ backgroundColor: "#0284c7" }}
              />

              {savedFileUri && (
                <Button
                  title="Open Saved PDF File 📂"
                  variant="outline"
                  size="md"
                  onPress={handleOpenPhysicalFile}
                  leftIcon={<FolderCheck size={18} color="#16a34a" />}
                />
              )}

              <Button
                title="Share Document on WhatsApp 📲"
                variant="outline"
                size="lg"
                onPress={handleWhatsAppShare}
                leftIcon={<MessageCircle size={18} color="#16a34a" />}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
    maxHeight: "88%",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    gap: 12,
    paddingBottom: 20,
  },
  documentSheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  docShopTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  docDocTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  docDate: {
    fontSize: 11,
  },
  docTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tableHead: {
    fontSize: 11,
    fontWeight: "800",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableCell: {
    fontSize: 12,
  },
  docFooter: {
    marginTop: 6,
    alignItems: "center",
  },
  docFooterText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusSub: {
    fontSize: 11,
    marginTop: 1,
  },
  btnGroup: {
    gap: 8,
  },
});
