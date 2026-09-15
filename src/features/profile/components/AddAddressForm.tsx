import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { AddressItem } from "@/store/useAddressStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Navigation, Home, Briefcase, MapPin } from "lucide-react-native";

interface AddAddressFormProps {
  onSave: (address: Omit<AddressItem, "id">) => void;
  onCancel: () => void;
}

export const AddAddressForm: React.FC<AddAddressFormProps> = ({ onSave, onCancel }) => {
  const { colors } = useThemeColor();
  const [type, setType] = useState<"Home" | "Work" | "Other">("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const handleUseGPS = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission is required to detect your address.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        if (geo.street || geo.name) setStreet([geo.name, geo.street].filter(Boolean).join(", "));
        if (geo.city || geo.subregion) setCity(geo.city || geo.subregion || "");
        if (geo.postalCode) setPincode(geo.postalCode);
      }
    } catch {
      alert("Could not detect GPS location. Please enter manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = () => {
    if (!street.trim() || !city.trim()) {
      alert("Please enter street address and city.");
      return;
    }
    onSave({
      type,
      street: street.trim(),
      city: city.trim(),
      pincode: pincode.trim() || undefined,
      isDefault: false,
    });
  };

  return (
    <View style={styles.form}>
      {/* Type Selector */}
      <View style={styles.typeRow}>
        {(["Home", "Work", "Other"] as const).map((t) => {
          const isSelected = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeChip,
                { borderColor: isSelected ? colors.primary : colors.surfaceBorder },
                isSelected && { backgroundColor: `${colors.primary}18` },
              ]}
            >
              {t === "Home" ? <Home size={13} color={colors.primary} /> : t === "Work" ? <Briefcase size={13} color={colors.primary} /> : <MapPin size={13} color={colors.primary} />}
              <Text style={[styles.typeText, { color: isSelected ? colors.primary : colors.text }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleUseGPS} disabled={isLocating} style={[styles.gpsBtn, { borderColor: colors.primary }]}>
        {isLocating ? <ActivityIndicator size="small" color={colors.primary} /> : <Navigation size={14} color={colors.primary} />}
        <Text style={[styles.gpsText, { color: colors.primary }]}>Use Current GPS Location</Text>
      </Pressable>

      <Input label="Street / Flat / House No." placeholder="e.g. Flat 301, Sunshine Heights" value={street} onChangeText={setStreet} />
      <View style={styles.cityPinRow}>
        <Input label="City" placeholder="City" value={city} onChangeText={setCity} containerStyle={styles.halfInput} />
        <Input label="Pincode" placeholder="Pincode" keyboardType="numeric" value={pincode} onChangeText={setPincode} containerStyle={styles.halfInput} />
      </View>

      <View style={styles.btnRow}>
        <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flexBtn} />
        <Button title="Save Address" onPress={handleSave} style={styles.flexBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 10, marginTop: 4 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeText: { fontSize: 12, fontWeight: "700" },
  gpsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" },
  gpsText: { fontSize: 12, fontWeight: "700" },
  cityPinRow: { flexDirection: "row", gap: 8 },
  halfInput: { flex: 1 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  flexBtn: { flex: 1 },
});
