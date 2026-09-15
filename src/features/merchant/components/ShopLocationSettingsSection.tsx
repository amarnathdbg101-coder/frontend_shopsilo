import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MapPin, Navigation, Compass, ExternalLink, CheckCircle2 } from "lucide-react-native";

interface ShopLocationSettingsSectionProps {
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  latitude: number | undefined;
  setLatitude: (v: number | undefined) => void;
  longitude: number | undefined;
  setLongitude: (v: number | undefined) => void;
  googleMapsUrl: string;
  setGoogleMapsUrl: (v: string) => void;
}

export const ShopLocationSettingsSection: React.FC<ShopLocationSettingsSectionProps> = ({
  address,
  setAddress,
  city,
  setCity,
  pincode,
  setPincode,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  googleMapsUrl,
  setGoogleMapsUrl,
}) => {
  const { colors, isDark } = useThemeColor();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    setDetectedSuccess(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to auto-detect your dukan coordinates."
        );
        setIsDetecting(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      setLatitude(lat);
      setLongitude(lng);

      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      setGoogleMapsUrl(mapsUrl);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const detectedCity = item.city || item.subregion || item.region || "";
        const detectedPincode = item.postalCode || "";
        const streetParts = [item.name, item.street, item.district].filter(Boolean);
        const detectedStreet = streetParts.join(", ");

        if (detectedCity && !city) setCity(detectedCity);
        if (detectedPincode && !pincode) setPincode(detectedPincode);
        if (detectedStreet && !address) setAddress(detectedStreet);
      }

      setDetectedSuccess(true);
      setTimeout(() => setDetectedSuccess(false), 4000);
    } catch (error) {
      console.error("[GPS Detect Error]", error);
      Alert.alert("GPS Error", "Could not fetch current coordinates. Please enter address manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const hasCoords = latitude !== undefined && longitude !== undefined;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
            <MapPin size={18} color="#10b981" />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dukan Location & GPS
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
              Precise location helps nearby customers find your counter
            </Text>
          </View>
        </View>
      </View>

      {/* GPS Auto-Detect Hero Banner */}
      <View
        style={[
          styles.gpsBanner,
          {
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "#f0fdf4",
            borderColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#bbf7d0",
          },
        ]}
      >
        <View style={styles.gpsInfo}>
          <Compass size={18} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.gpsTitle, { color: colors.text }]}>
              {hasCoords
                ? `GPS Set: ${latitude}° N, ${longitude}° E`
                : "Auto-detect Shop GPS Location"}
            </Text>
            <Text style={[styles.gpsSub, { color: colors.textMuted }]}>
              {hasCoords
                ? "Coordinates pinned for customer distance calculations"
                : "Stand inside your shop and tap button below"}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleDetectGPS}
          disabled={isDetecting}
          style={[styles.detectBtn, { backgroundColor: detectedSuccess ? "#16a34a" : "#059669" }]}
        >
          {isDetecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : detectedSuccess ? (
            <>
              <CheckCircle2 size={15} color="#fff" />
              <Text style={styles.detectBtnText}>GPS Pinned!</Text>
            </>
          ) : (
            <>
              <Navigation size={15} color="#fff" />
              <Text style={styles.detectBtnText}>
                {hasCoords ? "Re-detect GPS" : "Detect My Shop"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Coordinates Display Badge */}
      {hasCoords && (
        <View style={styles.coordsRow}>
          <View style={[styles.coordChip, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LAT:</Text>
            <Text style={[styles.coordVal, { color: colors.text }]}>{latitude}</Text>
          </View>
          <View style={[styles.coordChip, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.coordLabel, { color: colors.textMuted }]}>LNG:</Text>
            <Text style={[styles.coordVal, { color: colors.text }]}>{longitude}</Text>
          </View>
        </View>
      )}

      {/* Address Form Inputs */}
      <View style={styles.inputsList}>
        <View>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            Shop Address (Shop No, Market, Road) *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. Shop No. 14, Gandhi Market, Station Road"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>City / Town *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="e.g. Darbhanga"
              placeholderTextColor={colors.textMuted}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.col}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Pincode *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="e.g. 846004"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
          </View>
        </View>

        <View>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            Google Maps Link (Optional)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="https://maps.google.com/?q=..."
            placeholderTextColor={colors.textMuted}
            value={googleMapsUrl}
            onChangeText={setGoogleMapsUrl}
            autoCapitalize="none"
          />
        </View>
      </View>
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
  headerRow: {
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  gpsBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  gpsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  gpsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  detectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  detectBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  coordsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  coordChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: "800",
  },
  coordVal: {
    fontSize: 11,
    fontWeight: "700",
  },
  inputsList: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
  },
});
