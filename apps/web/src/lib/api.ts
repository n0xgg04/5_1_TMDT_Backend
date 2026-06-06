import axios, { AxiosError } from "axios";

const baseURL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000") + "/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 15_000,
});

function ensureSessionId() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("hotel_session_id")) {
    localStorage.setItem(
      "hotel_session_id",
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
  }
}
ensureSessionId();

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const sessionId = localStorage.getItem("hotel_session_id");
    if (sessionId) config.headers["x-session-id"] = sessionId;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as
      | (typeof err.config & { _retry?: boolean })
      | undefined;
    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      typeof window !== "undefined"
    ) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearAndRedirect();
        return Promise.reject(err);
      }
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${baseURL}/auth/refresh`, { refreshToken })
            .then((r) => {
              localStorage.setItem("accessToken", r.data.accessToken);
              localStorage.setItem("refreshToken", r.data.refreshToken);
              return r.data.accessToken as string;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const token = await refreshing;
        if (original.headers)
          original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearAndRedirect();
      }
    }
    return Promise.reject(err);
  },
);

function clearAndRedirect() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("hotel-auth");
  if (window.location.pathname !== "/login") window.location.href = "/login";
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined;

    const extract = (val: unknown): string | null => {
      if (typeof val === "string") return val;
      if (Array.isArray(val)) return val.join(", ");
      if (val && typeof val === "object") {
        const obj = val as Record<string, unknown>;
        return extract(obj.message ?? obj.error ?? null);
      }
      return null;
    };

    const m = extract(data?.message) ?? extract(data?.error);
    if (m) return m;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Đã xảy ra lỗi";
}
