import React from "react";
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocationStore } from "@/store/useLocationStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PresetLocation } from "@/features/location/types";
import { MapPin, Navigation, X, Check, AlertCircle, Compass } from "lucide-react-native";

const PRESET_LOCATIONS: PresetLocation[] = [
  { id: "dbg-tower", name: "Tower Chowk", city: "Darbhanga", state: "Bihar", latitude: 26.1542, longitude: 85.8918 },
  { id: "dbg-lah", name: "Laheriasarai", city: "Darbhanga", state: "Bihar", latitude: 26.1218, longitude: 85.8971 },
  { id: "patna-boring", name: "Boring Road", city: "Patna", state: "Bihar", latitude: 25.6197, longitude: 85.1256 },
  { id: "patna-kankar", name: "Kankarbagh", city: "Patna", state: "Bihar", latitude: 25.5978, longitude: 85.1583 },
  { id: "muz-center", name: "Motijheel", city: "Muzaffarpur", state: "Bihar", latitude: 26.1209, longitude: 85.3647 },
  { id: "delhi-cp", name: "Connaught Place", city: "New Delhi", state: "Delhi", latitude: 28.6304, longitude: 77.2177 },
];

const RADIUS_OPTIONS = [3, 5, 10, 15, 25, 50];

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();
  const { currentLocation, radiusKm, setRadiusKm, isDetecting, errorMsg, detectCurrentLocation, setLocation } = useLocationStore();

  const handleDetectGPS = async () => {
    const ok = await detectCurrentLocation();
    if (ok) onClose();
  };

  const handleSelectPreset = async (preset: PresetLocation) => {
    await setLocation({
      latitude: preset.latitude,
      longitude: preset.longitude,
      city: preset.city,
      suburb: preset.name,
      district: preset.city,
      formattedAddress: `${preset.name}, ${preset.city}`,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Location & Range</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Detect GPS Button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleDetectGPS}
            disabled={isDetecting}
            style={[styles.detectBtn, { backgroundColor: colors.primary }]}
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Navigation size={18} color="#ffffff" />
            )}
            <Text style={styles.detectBtnText}>
              {isDetecting ? "Detecting Accurate Location..." : "Use Current GPS Location"}
            </Text>
          </Pressable>

          {/* Search Distance Radius Section */}
          <View style={[styles.radiusBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <View style={styles.radiusHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Compass size={14} color={colors.primary} />
                <Text style={[styles.subHeading, { color: colors.text, marginBottom: 0 }]}>Store Distance Radius</Text>
              </View>
              <Text style={[styles.activeTag, { color: colors.primary }]}>Within {radiusKm} km</Text>
            </View>
            <View style={styles.radiusPillsRow}>
              {RADIUS_OPTIONS.map((km) => {
                const isSelected = radiusKm === km;
                return (
                  <Pressable
                    key={km}
                    onPress={() => setRadiusKm(km)}
                    style={[
                      styles.radiusChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.radiusChipText,
                        { color: isSelected ? colors.primaryForeground : colors.text },
                      ]}
                    >
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preset Locations */}
          <Text style={[styles.subHeading, { color: colors.textMuted, marginTop: 12 }]}>Popular Delivery Zones</Text>
          <ScrollView style={styles.presetList} showsVerticalScrollIndicator={false}>
            {PRESET_LOCATIONS.map((preset) => {
              const isSelected =
                currentLocation.city.toLowerCase() === preset.city.toLowerCase() &&
                currentLocation.suburb?.toLowerCase() === preset.name.toLowerCase();
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  onPress={() => handleSelectPreset(preset)}
                  style={[
                    styles.presetItem,
                    {
                      backgroundColor: isSelected ? "#ecfdf5" : colors.background,
                      borderColor: isSelected ? "#10b981" : colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetName, { color: colors.text }]}>{preset.name}</Text>
                    <Text style={[styles.presetSub, { color: colors.textMuted }]}>{preset.city}, {preset.state}</Text>
                  </View>
                  {isSelected && <Check size={18} color="#10b981" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, maxHeight: "85%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, borderBottomWidth: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "700" },
  closeBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, backgroundColor: "#fee2e2", borderRadius: 8, marginTop: 12 },
  errorText: { fontSize: 12, color: "#b91c1c", flex: 1 },
  detectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, marginTop: 14, marginBottom: 12 },
  detectBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  radiusBox: { padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  radiusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  activeTag: { fontSize: 12, fontWeight: "800" },
  radiusPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  radiusChipText: { fontSize: 12, fontWeight: "700" },
  subHeading: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  presetList: { maxHeight: 220 },
  presetItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  presetInfo: { gap: 2 },
  presetName: { fontSize: 14, fontWeight: "600" },
  presetSub: { fontSize: 12 },
});
