import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useQueryClient } from "@tanstack/react-query";
import { RegisterShopSuccess } from "@/features/merchant/components/RegisterShopSuccess";
import { ShopMediaUploadSection } from "@/features/merchant/components/ShopMediaUploadSection";
import { ShopBasicInfoSection } from "@/features/merchant/components/ShopBasicInfoSection";
import { ShopOperationalDetailsSection } from "@/features/merchant/components/ShopOperationalDetailsSection";
import { ShopRegistrationLockView } from "@/features/merchant/components/ShopRegistrationLockView";
import { isShopRegistrationUnlocked } from "@/features/merchant/services/shopAccessGate";
import { uploadShopMedia } from "@/features/merchant/services/imageUpload";
import { Store, ArrowLeft } from "lucide-react-native";

export default function RegisterShopScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useThemeColor();
  const { user, setUser } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [isUnlocked, setIsUnlocked] = useState(isAdmin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setIsUnlocked(true);
      return;
    }
    const checkStatus = async () => {
      if (user?.id) {
        const unlocked = await isShopRegistrationUnlocked(user.id);
        setIsUnlocked(unlocked);
      }
    };
    checkStatus();
  }, [user?.id, isAdmin]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kirana & Retail");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [timing, setTiming] = useState("9:00 AM - 9:00 PM");
  const [logoUri, setLogoUri] = useState("");
  const [banners, setBanners] = useState<string[]>([]);
  const [pincode, setPincode] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [weeklyOff, setWeeklyOff] = useState("None");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) return Alert.alert("Required", "Shop name must be at least 2 characters.");
    if (!category.trim()) return Alert.alert("Required", "Please enter business category.");
    if (!address.trim() || address.trim().length < 5) return Alert.alert("Required", "Please enter complete shop address.");

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        category: category.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp_number: whatsapp.trim() || phone.trim() || undefined,
        description: description.trim() || undefined,
        timing: timing.trim() || undefined,
        weekly_off: weeklyOff.trim() || undefined,
      };

      await apiClient.post("/shops", payload);
      if (user) await setUser({ ...user, role: "shop" });

      // Upload photos to Cloudflare R2 if selected
      if (logoUri || banners.length > 0) {
        try {
          await uploadShopMedia(logoUri, banners);
        } catch (mediaErr) {
          console.warn("[RegisterShop] Cloudflare media upload non-fatal warning:", mediaErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["shop", "me"] });
      setSuccess(true);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to register shop.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <ScreenWrapper style={styles.container}>
        <RegisterShopSuccess
          onOpenDashboard={() => router.replace("/merchant/dashboard")}
          onSwitchToCustomer={() => router.replace("/(tabs)")}
        />
      </ScreenWrapper>
    );
  }

  // 🔒 Gate: Require Admin OTP verification for non-admins
  if (!isUnlocked && !isAdmin) {
    return (
      <ScreenWrapper style={styles.container}>
        <ShopRegistrationLockView
          user={user}
          onUnlocked={() => setIsUnlocked(true)}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Store size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Open Your Shop</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Add photos, banners, timings & start selling to nearby customers
          </Text>
        </View>

        <ShopMediaUploadSection logoUri={logoUri} setLogoUri={setLogoUri} banners={banners} setBanners={setBanners} />

        <ShopBasicInfoSection
          name={name} setName={setName}
          category={category} setCategory={setCategory}
          address={address} setAddress={setAddress}
          city={city} setCity={setCity}
          phone={phone} setPhone={setPhone}
        />

        <ShopOperationalDetailsSection
          pincode={pincode} setPincode={setPincode}
          whatsapp={whatsapp} setWhatsapp={setWhatsapp}
          weeklyOff={weeklyOff} setWeeklyOff={setWeeklyOff}
          description={description} setDescription={setDescription}
        />

        <Button
          title={isSubmitting ? "Launching Your Store..." : "Register & Launch My Shop"}
          size="lg"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 12, gap: 8 },
  backBtn: { alignSelf: "flex-start", padding: 4 },
  header: { alignItems: "center", marginBottom: 6 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, textAlign: "center", paddingHorizontal: 12 },
  submitBtn: { marginTop: 10, marginBottom: 30 },
});
