import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Config } from "@/constants/config";
import { Endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/store/useAuthStore";
import { SecureStorage } from "@/utils/secure-storage";
import { User } from "@/features/auth/types";
import { appendFileToFormData, uploadMultipart } from "@/utils/multipartUpload";

export const useUploadAvatar = () => {
  const [isUploading, setIsUploading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const uploadFromUri = async (uri: string, mimeType?: string, fileName?: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      const token = useAuthStore.getState().accessToken || (await SecureStorage.getAccessToken());
      if (!token) {
        Alert.alert("Session Expired", "Please sign in again to upload profile picture.");
        return null;
      }

      const formData = new FormData();
      const sanitizedType = (mimeType || "image/jpeg").toLowerCase();
      const resolvedName = fileName || (sanitizedType.includes("png") ? "avatar.png" : "avatar.jpg");

      await appendFileToFormData(formData, "avatar", uri, resolvedName, sanitizedType);

      const response = await uploadMultipart<{
        success?: boolean;
        message?: string;
        data?: { avatar_url?: string };
      }>(`${Config.API_BASE_URL}${Endpoints.USER.AVATAR}`, formData, {
        token,
        timeout: 30000,
      });

      const json = response.data;
      if (!response.ok || !json?.success || !json.data?.avatar_url) {
        const errorMsg = json?.message || `Upload failed with status ${response.status}`;
        console.error("[Avatar Upload Backend Error]", errorMsg, json);
        Alert.alert("Upload Failed", errorMsg);
        return null;
      }

      const rawUrl: string = json.data.avatar_url;
      const finalUrl = rawUrl.startsWith("http") ? rawUrl : `${Config.API_BASE_URL}${rawUrl}`;

      if (user) {
        const updatedUser: User = {
          ...user,
          avatar_url: finalUrl,
          updated_at: new Date().toISOString(),
        };
        await setUser(updatedUser);
      }

      return finalUrl;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Network error uploading image.";
      console.error("[Avatar Upload Error]", error);
      Alert.alert("Upload Error", msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const pickImageFromGallery = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Permission to access photos is needed to choose an avatar.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, // Ensures output size stays well below backend 2MB limit
    });

    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return uploadFromUri(asset.uri, asset.mimeType, asset.fileName || "avatar.jpg");
  };

  const takePhotoWithCamera = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Permission to access camera is needed to take a profile picture.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, // Ensures output size stays well below backend 2MB limit
    });

    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return uploadFromUri(asset.uri, asset.mimeType, asset.fileName || "camera_avatar.jpg");
  };

  return {
    pickImageFromGallery,
    takePhotoWithCamera,
    isUploading,
  };
};
