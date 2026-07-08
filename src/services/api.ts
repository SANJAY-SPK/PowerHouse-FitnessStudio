import axios from "axios";
import { API_BASE_URL } from "@/constants/config";
import { clearStoredAuth, getCachedAuth, readStoredAuth } from "./authStorage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Render free tier cold-starts can take up to 50s.
  // 60s timeout ensures the first request after inactivity still succeeds.
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

let unauthorizedHandler: (() => Promise<void> | void) | null = null;
let isHandlingUnauthorized = false;

export const setUnauthorizedHandler = (handler: () => Promise<void> | void) => {
  unauthorizedHandler = handler;
};

const handleUnauthorized = async () => {
  if (isHandlingUnauthorized) return;

  isHandlingUnauthorized = true;
  try {
    if (unauthorizedHandler) {
      await unauthorizedHandler();
    } else {
      await clearStoredAuth();
      delete api.defaults.headers.common.Authorization;
    }
  } finally {
    isHandlingUnauthorized = false;
  }
};

api.interceptors.request.use(
  async (config) => {
    const cachedToken = getCachedAuth().token;
    const { token } = cachedToken ? { token: cachedToken } : await readStoredAuth();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const serverMessage =
      responseData?.message ||
      responseData?.error ||
      (typeof responseData === 'string' ? responseData : undefined);

    console.log(
      '[API] Error:',
      status,
      error.config?.url,
      serverMessage,
      'responseData:',
      responseData,
    );

    if (status === 401) {
      await handleUnauthorized();
    }

    const readableError =
      status === 403
        ? serverMessage || 'You do not have permission to access this screen.'
        : serverMessage || `Request failed (${status ?? 'network error'})`;
    const readable = new Error(readableError) as Error & { status?: number };
    readable.status = status;
    return Promise.reject(readable);
  }
);
