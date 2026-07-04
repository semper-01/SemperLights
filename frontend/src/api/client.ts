import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import config from "@/config";
import { storage } from "@/utils/storage";

const apiClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = storage.getRefreshToken();

      if (refreshToken && !originalRequest.url?.includes("/auth/refresh/")) {
        try {
          const response = await axios.post(
            `${config.api.baseURL}/auth/refresh/`,
            { refresh: refreshToken }
          );
          const { access } = response.data as { access: string };
          storage.setToken(access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return apiClient(originalRequest);
        } catch {
          storage.clearAuth();
        }
      } else if (!originalRequest.url?.includes("/auth/refresh/")) {
        storage.clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;