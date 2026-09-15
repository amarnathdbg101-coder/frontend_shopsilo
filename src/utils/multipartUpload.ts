import { Platform } from "react-native";

export interface MultipartUploadOptions {
  token?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface MultipartUploadResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Robust cross-platform helper to append an image/file to FormData.
 * - On Web: fetches the URI as a Blob and appends it.
 * - On Native (Android/iOS): creates the standard React Native file descriptor { uri, name, type }
 *   with safe normalized URI formatting.
 */
export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append(fieldName, blob, fileName);
  } else {
    const normalizedUri =
      Platform.OS === "android" && !uri.startsWith("content://") && !uri.startsWith("file://")
        ? `file://${uri}`
        : uri;

    formData.append(fieldName, {
      uri: normalizedUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }
}

/**
 * Uploads FormData reliably across React Native (Android/iOS) and Web using XMLHttpRequest.
 *
 * Why XMLHttpRequest?
 * Expo SDK 52+ / 57 introduced WinterCG-compliant fetch which throws:
 * "[Error: Unsupported FormDataPart implementation]" when encountering React Native's
 * proprietary { uri, name, type } FormData part.
 * XMLHttpRequest bypasses Expo's fetch serializer and delegates directly to React Native's
 * native RCTNetworking module (Android/iOS), which natively streams local file/content URIs.
 */
export function uploadMultipart<T = any>(
  url: string,
  formData: FormData,
  options: MultipartUploadOptions = {}
): Promise<MultipartUploadResponse<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (options.timeout) {
      xhr.timeout = options.timeout;
    }

    if (options.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${options.token}`);
    }

    xhr.setRequestHeader("Accept", "application/json");

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        // Crucial: do NOT set Content-Type header so the networking layer can set boundary
        if (key.toLowerCase() !== "content-type") {
          xhr.setRequestHeader(key, value);
        }
      }
    }

    xhr.onload = () => {
      let data: T;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = (xhr.responseText || "") as unknown as T;
      }

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    };

    xhr.onerror = () => {
      reject(new Error("Network error during file upload. Please check your internet connection."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload request timed out. Please try again."));
    };

    xhr.send(formData);
  });
}
