import { Config } from "@/constants/config";
import { Endpoints } from "@/api/endpoints";
import { SecureStorage } from "@/utils/secure-storage";
import { useAuthStore } from "@/store/useAuthStore";
import { appendFileToFormData, uploadMultipart } from "@/utils/multipartUpload";

interface UploadShopMediaResult {
  logoUrl?: string;
  bannerUrls: string[];
}

/**
 * Uploads up to 4 product photos directly to Go backend / Cloudflare R2
 */
export async function uploadProductImages(uris: string[]): Promise<string[]> {
  if (!uris || uris.length === 0) return [];

  const token = useAuthStore.getState().accessToken || (await SecureStorage.getAccessToken());
  if (!token) throw new Error("Authentication required to upload product images.");

  const formData = new FormData();

  for (let i = 0; i < Math.min(uris.length, 4); i++) {
    const uri = uris[i];
    const fileName = `product_${Date.now()}_${i}.jpg`;
    const mimeType = "image/jpeg";
    await appendFileToFormData(formData, "images", uri, fileName, mimeType);
  }

  const response = await uploadMultipart<{
    success?: boolean;
    message?: string;
    data?: { images?: string[] };
  }>(`${Config.API_BASE_URL}${Endpoints.PRODUCTS.UPLOAD_IMAGES}`, formData, {
    token,
    timeout: 60000,
  });

  const json = response.data;
  if (!response.ok || !json?.success || !json.data?.images) {
    throw new Error(json?.message || "Failed to upload product images to Cloudflare R2");
  }

  return json.data.images as string[];
}

/**
 * Uploads shop logo and up to 2 promotional banners to Cloudflare R2
 */
export async function uploadShopMedia(
  logoUri?: string,
  bannerUris?: string[]
): Promise<UploadShopMediaResult> {
  const token = useAuthStore.getState().accessToken || (await SecureStorage.getAccessToken());
  if (!token) throw new Error("Authentication required to upload shop media.");

  const formData = new FormData();
  let hasFiles = false;

  if (logoUri && (logoUri.startsWith("file://") || logoUri.startsWith("content://") || logoUri.startsWith("blob:"))) {
    hasFiles = true;
    const fileName = `shop_logo_${Date.now()}.jpg`;
    await appendFileToFormData(formData, "logo", logoUri, fileName, "image/jpeg");
  }

  if (bannerUris && bannerUris.length > 0) {
    const localBanners = bannerUris.filter(
      (b) => b.startsWith("file://") || b.startsWith("content://") || b.startsWith("blob:")
    );

    for (let i = 0; i < Math.min(localBanners.length, 2); i++) {
      hasFiles = true;
      const bUri = localBanners[i];
      const fileName = `shop_banner_${Date.now()}_${i}.jpg`;
      await appendFileToFormData(formData, "banners", bUri, fileName, "image/jpeg");
    }
  }

  if (!hasFiles) {
    return {
      logoUrl: logoUri,
      bannerUrls: bannerUris || [],
    };
  }

  const response = await uploadMultipart<{
    success?: boolean;
    message?: string;
    data?: { logo_url?: string; banners?: string[] };
  }>(`${Config.API_BASE_URL}${Endpoints.MERCHANT.UPLOAD_IMAGES}`, formData, {
    token,
    timeout: 60000,
  });

  const json = response.data;
  if (!response.ok || !json?.success) {
    throw new Error(json?.message || "Failed to upload shop media to Cloudflare R2");
  }

  const uploadedLogo = json.data?.logo_url || logoUri;
  const uploadedBanners = (json.data?.banners as string[]) || bannerUris || [];

  return {
    logoUrl: uploadedLogo,
    bannerUrls: uploadedBanners,
  };
}
