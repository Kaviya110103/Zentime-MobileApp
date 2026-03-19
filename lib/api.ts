type QueryValue = string | number | boolean | null | undefined;

const DEFAULT_BASE_URL = "http://192.168.1.6:8080/";

function normalizeBaseUrl(rawBaseUrl: string): string {
  // Prevent runtime URL parsing errors from accidental spaces in env/default values.
  return rawBaseUrl.trim().replace(/\s+/g, "").replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL);

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
