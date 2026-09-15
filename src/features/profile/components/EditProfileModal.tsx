import React, { useState, useEffect } from "react";
import { Modal, StyleSheet, Text, View, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { User } from "@/features/auth/types";
import { Config } from "@/constants/config";
import { useUpdateProfile } from "@/features/profile/api/useUpdateProfile";
import { useUploadAvatar } from "@/features/profile/api/useUploadAvatar";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Check, UserCheck, Camera, Image as ImageIcon } from "lucide-react-native";

interface EditProfileModalProps {
  user?: User | null;
  visible: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, visible, onClose }) => {
  const { colors } = useThemeColor();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { pickImageFromGallery, takePhotoWithCamera, isUploading } = useUploadAvatar();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || AVATAR_PRESETS[0]);

  useEffect(() => {
    if (user?.avatar_url) setSelectedAvatar(user.avatar_url);
    if (user?.full_name) setFullName(user.full_name);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  const handlePickGallery = async () => {
    const url = await pickImageFromGallery();
    if (url) setSelectedAvatar(url);
  };
  const handleTakePhoto = async () => {
    const url = await takePhotoWithCamera();
    if (url) setSelectedAvatar(url);
  };
  const handleSave = () => {
    updateProfile(
      { full_name: fullName.trim() || user?.full_name, phone: phone.trim() || user?.phone, avatar_url: selectedAvatar },
      { onSuccess: () => onClose() }
    );
  };

  const avatarSrc =
    selectedAvatar.startsWith("http") || selectedAvatar.startsWith("file:") || selectedAvatar.startsWith("content:")
      ? selectedAvatar
      : `${Config.API_BASE_URL}${selectedAvatar}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <UserCheck size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.avatarPreviewWrap}>
              <Image source={{ uri: avatarSrc }} style={styles.previewImg} />
              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>

            {/* Upload Buttons */}
            <View style={styles.uploadBtnRow}>
              <Pressable onPress={handlePickGallery} disabled={isUploading} style={[styles.uploadActionBtn, { borderColor: colors.surfaceBorder }]}>
                <ImageIcon size={15} color={colors.primary} />
                <Text style={[styles.uploadActionText, { color: colors.text }]}>Gallery</Text>
              </Pressable>
              <Pressable onPress={handleTakePhoto} disabled={isUploading} style={[styles.uploadActionBtn, { borderColor: colors.surfaceBorder }]}>
                <Camera size={15} color={colors.primary} />
                <Text style={[styles.uploadActionText, { color: colors.text }]}>Camera</Text>
              </Pressable>
            </View>

            {/* Avatar Presets */}
            <Text style={[styles.label, { color: colors.textMuted }]}>Or choose a sample avatar</Text>
            <View style={styles.avatarRow}>
              {AVATAR_PRESETS.map((avatar) => {
                const isSelected = selectedAvatar === avatar;
                return (
                  <Pressable
                    key={avatar}
                    onPress={() => setSelectedAvatar(avatar)}
                    style={[styles.avatarChoice, isSelected && { borderColor: colors.primary, borderWidth: 3 }]}
                  >
                    <Image source={{ uri: avatar }} style={styles.avatarImg} />
                    {selectedAvatar === avatar && (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}><Check size={9} color="#ffffff" /></View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
            <Input label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="10-digit mobile" keyboardType="phone-pad" />

            <Button title="Save Changes" isLoading={isUpdating || isUploading} onPress={handleSave} style={styles.saveBtn} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, maxHeight: "88%", borderRadius: 20, borderWidth: 1, padding: 18, elevation: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  content: { gap: 10 },
  avatarPreviewWrap: { alignSelf: "center", width: 80, height: 80, borderRadius: 40, overflow: "hidden", position: "relative", borderWidth: 2, borderColor: "#ea580c" },
  previewImg: { width: "100%", height: "100%" },
  uploadOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  uploadBtnRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  uploadActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  uploadActionText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 2 },
  avatarRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 2 },
  avatarChoice: { width: 50, height: 50, borderRadius: 25, overflow: "hidden", borderWidth: 1, borderColor: "#cbd5e1" },
  avatarImg: { width: "100%", height: "100%" },
  checkBadge: { position: "absolute", bottom: 1, right: 1, width: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  saveBtn: { marginTop: 6 },
});
