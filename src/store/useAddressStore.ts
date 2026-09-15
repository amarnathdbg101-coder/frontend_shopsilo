import { create } from "zustand";
import { Storage } from "@/utils/storage";

export interface AddressItem {
  id: string;
  type: "Home" | "Work" | "Other";
  street: string;
  landmark?: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
}

const STORAGE_KEY = "shopsilo_saved_addresses";

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: "1",
    type: "Home",
    street: "Flat 402, Green Valley Apartments, MG Road",
    city: "Bengaluru",
    pincode: "560001",
    isDefault: true,
  },
  {
    id: "2",
    type: "Work",
    street: "Tech Park, 3rd Floor, Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
    isDefault: false,
  },
];

interface AddressState {
  addresses: AddressItem[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addAddress: (address: Omit<AddressItem, "id">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: INITIAL_ADDRESSES,
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await Storage.getItem<AddressItem[]>(STORAGE_KEY);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        set({ addresses: stored, isHydrated: true });
        return;
      }
    } catch {
      // fallback to initial
    }
    set({ isHydrated: true });
  },

  addAddress: async (data) => {
    const addresses = get().addresses;
    const isFirst = addresses.length === 0;
    const newAddress: AddressItem = {
      ...data,
      id: Date.now().toString(),
      isDefault: isFirst || data.isDefault,
    };

    let updated = [...addresses, newAddress];
    if (newAddress.isDefault) {
      updated = updated.map((a) => (a.id === newAddress.id ? a : { ...a, isDefault: false }));
    }

    set({ addresses: updated });
    await Storage.setItem(STORAGE_KEY, updated);
  },

  removeAddress: async (id) => {
    const updated = get().addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    set({ addresses: updated });
    await Storage.setItem(STORAGE_KEY, updated);
  },

  setDefaultAddress: async (id) => {
    const updated = get().addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    set({ addresses: updated });
    await Storage.setItem(STORAGE_KEY, updated);
  },
}));
