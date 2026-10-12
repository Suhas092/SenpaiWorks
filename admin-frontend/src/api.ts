import { z } from "zod";
export const API_BASE = import.meta.env["VITE_API_BASE_URL"] || "/api";
export const DEMO_MODE = import.meta.env["VITE_DEMO_MODE"] !== "false";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  z.string()
    .startsWith("/")
    .max(500)
    .refine((v) => !v.includes("..") && !v.startsWith("//"))
    .parse(path);
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `Request failed (${response.status})`,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, data: unknown) => request<T>(path, "POST", data);
export const put = <T>(path: string, data: unknown) => request<T>(path, "PUT", data);
export const patch = <T>(path: string, data: unknown) => request<T>(path, "PATCH", data);
export const del = <T>(path: string) => request<T>(path, "DELETE");
