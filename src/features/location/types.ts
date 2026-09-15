export interface UserLocation {
  latitude: number;
  longitude: number;
  city: string;
  suburb?: string;
  street?: string;
  district?: string;
  pincode?: string;
  formattedAddress: string;
}

export interface PresetLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}
