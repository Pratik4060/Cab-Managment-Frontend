import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cab_admin_token");
  if (token && !(config as ApiRequestConfig).skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status || 0;
    const data = error.response?.data;

    if (status === 401 || status === 403) {
      handleAuthFailure(status, data);
    }

    return Promise.reject(new ApiError(getMessage(data, status), status, data));
  }
);

type ApiRequestConfig = AxiosRequestConfig & { skipAuth?: boolean };

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

export function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

function getMessage(data: unknown, status: number) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message;
  }
  if (status === 401) return "Your session has expired. Please login again.";
  if (status === 403) return "You do not have permission to perform this action.";
  return "Something went wrong. Please try again.";
}

function handleAuthFailure(status: number, data: unknown) {
  localStorage.removeItem("cab_admin_token");
  localStorage.removeItem("cab_admin_user");
  window.dispatchEvent(new CustomEvent("cab-auth-failed", {
    detail: {
      status,
      message: getMessage(data, status)
    }
  }));
}
