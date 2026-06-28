import axios, { AxiosError } from "axios";
import {
  ACCESS_TOKEN_KEY,
  ACTIVE_FACILITY_KEY,
  API_BASE_URL,
  MANAGEMENT_ACCESS_TOKEN_KEY,
} from "./constants";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, unknown>;
}

export type ApiResult<T> = {
  data: T;
  message?: string;
  success?: boolean;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: string[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
  return value ? decodeURIComponent(value) : null;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const tokenKey =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/management")
      ? MANAGEMENT_ACCESS_TOKEN_KEY
      : ACCESS_TOKEN_KEY;
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem(tokenKey) ??
        window.sessionStorage.getItem(tokenKey) ??
        readCookie(tokenKey)
      : null;

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeFacilityId =
    typeof window !== "undefined"
      ? window.localStorage.getItem(ACTIVE_FACILITY_KEY)
      : null;
  if (activeFacilityId) {
    config.headers["X-Facility-Id"] = activeFacilityId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message = error.response?.data?.message ?? error.message ?? "Không thể kết nối API.";
    const fields = error.response?.data?.errors?.fields;
    return Promise.reject(
      new ApiClientError(
        message,
        Array.isArray(fields)
          ? fields.filter((field): field is string => typeof field === "string")
          : [],
      ),
    );
  },
);

//chỉ lấy data, dùng cho profile/settings/upload...
export async function unwrapApiData<T>(request: Promise<{ data: ApiResponse<T> }>) {
  const response = await request;
  return response.data.data;
}

// Hàm mới: lấy cả data + message, dùng cho login/register
export async function unwrapApiResponse<T>(
  request: Promise<{ data: ApiResponse<T> }>
): Promise<ApiResult<T>> {
  const response = await request;

  return {
    data: response.data.data,
    message: response.data.message,
    success: response.data.success,
  };
}
