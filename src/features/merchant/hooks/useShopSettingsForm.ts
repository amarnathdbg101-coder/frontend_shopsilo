import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { uploadShopMedia } from "@/features/merchant/services/imageUpload";
import { Shop } from "@/features/shops/types";
import { UseMutationResult } from "@tanstack/react-query";

export function useShopSettingsForm(shop: Shop | null | undefined, updateMutation: UseMutationResult<any, any, any, any>) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [timing, setTiming] = useState("");
  const [weeklyOff, setWeeklyOff] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUri, setLogoUri] = useState("");
  const [banners, setBanners] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      setCategory(shop.category || "");
      setPhone(shop.phone || "");
      setWhatsapp(shop.whatsapp_number || shop.phone || "");
      setTiming(shop.timing || "9:00 AM - 9:00 PM");
      setWeeklyOff(shop.weekly_off || "None");
      setAddress(shop.address || "");
      setCity(shop.city || "");
      setPincode(shop.pincode || "");
      setLatitude(shop.latitude);
      setLongitude(shop.longitude);
      setGoogleMapsUrl(shop.google_maps_url || "");
      setDescription(shop.description || "");
      setLogoUri(shop.logo_url || "");
      setBanners((shop.banners || []).slice(0, 2));
    }
  }, [shop]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Required", "Shop name cannot be empty.");

    const trimmedBanners = banners.slice(0, 2);

    try {
      setIsSaving(true);
      let finalLogo = logoUri;
      let finalBanners = trimmedBanners;

      const needsLogoUpload = logoUri && (logoUri.startsWith("file://") || logoUri.startsWith("content://") || logoUri.startsWith("blob:"));
      const needsBannerUpload = trimmedBanners.some((b) => b.startsWith("file://") || b.startsWith("content://") || b.startsWith("blob:"));

      if (needsLogoUpload || needsBannerUpload) {
        const uploadRes = await uploadShopMedia(logoUri, trimmedBanners);
        if (uploadRes.logoUrl) finalLogo = uploadRes.logoUrl;
        if (uploadRes.bannerUrls?.length) finalBanners = uploadRes.bannerUrls;
      }

      updateMutation.mutate(
        {
          name: name.trim(),
          category: category.trim() || undefined,
          phone: phone.trim() || undefined,
          whatsapp_number: whatsapp.trim() || undefined,
          timing: timing.trim() || undefined,
          weekly_off: weeklyOff.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          pincode: pincode.trim() || undefined,
          latitude,
          longitude,
          google_maps_url: googleMapsUrl.trim() || undefined,
          description: description.trim() || undefined,
          logo_url: finalLogo || undefined,
          banners: finalBanners.length > 0 ? finalBanners : undefined,
        },
        {
          onSuccess: () => {
            Alert.alert("Store Saved!", "Your shop details and photos have been successfully updated.", [
              { text: "OK", onPress: () => router.back() },
            ]);
          },
          onError: () => Alert.alert("Save Failed", "Could not update store settings. Please try again."),
          onSettled: () => setIsSaving(false),
        }
      );
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert("Upload Error", err.message || "Failed to upload shop photos to Cloudflare R2.");
    }
  };

  return {
    name, setName,
    category, setCategory,
    phone, setPhone,
    whatsapp, setWhatsapp,
    timing, setTiming,
    weeklyOff, setWeeklyOff,
    address, setAddress,
    city, setCity,
    pincode, setPincode,
    latitude, setLatitude,
    longitude, setLongitude,
    googleMapsUrl, setGoogleMapsUrl,
    description, setDescription,
    logoUri, setLogoUri,
    banners, setBanners,
    isSaving,
    handleSave,
  };
}
