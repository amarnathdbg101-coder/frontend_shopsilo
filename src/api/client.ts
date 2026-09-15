import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Config } from "@/constants/config";
import { Endpoints } from "@/api/endpoints";
import { ApiError, ApiErrorPayload, ApiResponse } from "@/types/api";
import { SecureStorage } from "@/utils/secure-storage";
import { useAuthStore } from "@/store/useAuthStore";
import { RefreshResponseData } from "@/features/auth/types";
import { normalizeError } from "@/api/errorFormatter";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach live base URL & Bearer JWT Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ensure base URL always points to active Config.API_BASE_URL
    config.baseURL = Config.API_BASE_URL;

    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );

    const memoryToken = useAuthStore.getState().accessToken;
    const token = memoryToken || (await SecureStorage.getAccessToken());

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(normalizeError(error));
  }
);

// 2. Response Interceptor: Automatic Refresh on 401 & Error Normalization
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(normalizeError(error));
    }

    const isAuthEndpoint =
      originalRequest.url?.includes(Endpoints.AUTH.LOGIN) ||
      originalRequest.url?.includes(Endpoints.AUTH.REFRESH) ||
      originalRequest.url?.includes(Endpoints.AUTH.REGISTER);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(normalizeError(err)));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStorage.getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token available");

        const refreshRes = await axios.post<ApiResponse<RefreshResponseData>>(
          `${Config.API_BASE_URL}${Endpoints.AUTH.REFRESH}`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken =
          refreshRes.data.data?.access_token ||
          (refreshRes.data as unknown as RefreshResponseData).access_token;

        if (!newAccessToken) throw new Error("Invalid token response from refresh endpoint");

        useAuthStore.getState().setAccessToken(newAccessToken);
        const existingRefreshToken = refreshRes.data.data?.refresh_token || refreshToken;
        await SecureStorage.setTokens({
          accessToken: newAccessToken,
          refreshToken: existingRefreshToken,
        });

        processQueue(null, newAccessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await useAuthStore.getState().logout();
        return Promise.reject(normalizeError(refreshErr));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export { normalizeError } from "@/api/errorFormatter";

