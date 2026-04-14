import axios from "axios";
import { getBearerToken } from "@/lib/authToken";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Global error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.error("Acesso negado:", error.response?.data);
    } else if (status === 404) {
      console.warn("Recurso não encontrado:", error.config?.url);
    } else if (status && status >= 500) {
      console.error("Erro interno do servidor:", error.response?.data);
    }
    return Promise.reject(error);
  }
);
