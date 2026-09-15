import { create } from "zustand";
import * as Location from "expo-location";
import { UserLocation } from "@/features/location/types";
import { Storage } from "@/utils/storage";

const STORAGE_KEY = "@shopsilo_user_location";
const RADIUS_STORAGE_KEY = "@shopsilo_search_radius_km";

const DEFAULT_LOCATION: UserLocation = {
  latitude: 26.1542,
  longitude: 85.8918,
  city: "Darbhanga",
  suburb: "Tower Chowk",
  district: "Darbhanga",
  pincode: "846004",
  formattedAddress: "Tower Chowk, Darbhanga",
};

interface LocationState {
  currentLocation: UserLocation;
  radiusKm: number;
  isDetecting: boolean;
  isHydrated: boolean;
  permissionGranted: boolean | null;
  errorMsg: string | null;
  initLocation: () => Promise<void>;
  detectCurrentLocation: () => Promise<boolean>;
  setLocation: (loc: UserLocation) => Promise<void>;
  setRadiusKm: (km: number) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: DEFAULT_LOCATION,
  radiusKm: 10,
  isDetecting: false,
  isHydrated: false,
  permissionGranted: null,
  errorMsg: null,

  initLocation: async () => {
    try {
      const [savedLoc, savedRadius] = await Promise.all([
        Storage.getItem<UserLocation>(STORAGE_KEY),
        Storage.getItem<number>(RADIUS_STORAGE_KEY),
      ]);
      set({
        currentLocation: savedLoc && savedLoc.latitude && savedLoc.longitude ? savedLoc : DEFAULT_LOCATION,
        radiusKm: savedRadius && savedRadius > 0 ? savedRadius : 10,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  detectCurrentLocation: async () => {
    set({ isDetecting: true, errorMsg: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set({
          isDetecting: false,
          permissionGranted: false,
          errorMsg: "Location permission denied. Please select city manually.",
        });
        return false;
      }

      set({ permissionGranted: true });

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      let city = "Nearby";
      let suburb = "";
      let district = "";
      let pincode = "";

      if (geocode && geocode.length > 0) {
        const first = geocode[0];
        city = first.city || first.subregion || first.region || "Nearby";
        suburb = first.name || first.district || first.street || "";
        district = first.subregion || first.city || "";
        pincode = first.postalCode || "";
      }

      const formattedAddress = suburb ? `${suburb}, ${city}` : city;

      const detectedLocation: UserLocation = {
        latitude,
        longitude,
        city,
        suburb,
        district,
        pincode,
        formattedAddress,
      };

      await get().setLocation(detectedLocation);
      set({ isDetecting: false, errorMsg: null });
      return true;
    } catch (err) {
      set({
        isDetecting: false,
        errorMsg: err instanceof Error ? err.message : "Failed to detect GPS location",
      });
      return false;
    }
  },

  setLocation: async (loc: UserLocation) => {
    await Storage.setItem(STORAGE_KEY, loc);
    set({ currentLocation: loc, errorMsg: null });
  },

  setRadiusKm: async (km: number) => {
    const validKm = km > 0 ? km : 10;
    await Storage.setItem(RADIUS_STORAGE_KEY, validKm);
    set({ radiusKm: validKm });
  },
}));
