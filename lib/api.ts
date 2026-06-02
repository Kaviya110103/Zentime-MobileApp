type QueryValue = string | number | boolean | null | undefined;

const DEFAULT_BASE_URL = "http://192.168.1.3:8080";

function inferDefaultBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.trim();
    if (host.length > 0) {
      return `http://${host}:8080`;
    }
  }
  return DEFAULT_BASE_URL;
}

function normalizeBaseUrl(rawBaseUrl: string): string {
  // Prevent runtime URL parsing errors from accidental spaces in env/default values.
  return rawBaseUrl.trim().replace(/\s+/g, "").replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || inferDefaultBaseUrl());

export function resolveAssetUrl(rawUrl?: string | null): string {
  const value = (rawUrl || "").trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("data:") || value.startsWith("file://")) {
    return value;
  }

  // Backend may return localhost links that are unreachable from real devices.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
    } catch {
      return value;
    }
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function buildApiUrl(
  path: string,
  options?: {
    clientId?: number | string | null;
    query?: Record<string, QueryValue>;
  }
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  if (options?.clientId !== undefined && options?.clientId !== null && `${options.clientId}`.length > 0) {
    url.searchParams.set("clientId", String(options.clientId));
  }

  return url.toString();
}

export function withClientId<T extends Record<string, unknown>>(params: T, clientId?: number | string | null): T {
  if (clientId === undefined || clientId === null || `${clientId}`.length === 0) {
    return params;
  }
  return { ...params, clientId };
}
