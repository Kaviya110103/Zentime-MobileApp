type QueryValue = string | number | boolean | null | undefined;

const DEFAULT_BASE_URL = "https://test.zentime.co.in";
const DEFAULT_TENANT_DOMAIN_SUFFIX = "zentime.co.in";

function normalizeBaseUrl(rawBaseUrl: string): string {
  // Prevent runtime URL parsing errors from accidental spaces in env/default values.
  return rawBaseUrl.trim().replace(/\s+/g, "").replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL);
const TENANT_DOMAIN_SUFFIX = (process.env.EXPO_PUBLIC_TENANT_DOMAIN_SUFFIX || DEFAULT_TENANT_DOMAIN_SUFFIX)
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");

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

export function buildTenantApiUrl(companyCode: string, path: string): string {
  const tenant = companyCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${tenant}.${TENANT_DOMAIN_SUFFIX}${normalizedPath}`;
}

export function withClientId<T extends Record<string, unknown>>(params: T, clientId?: number | string | null): T {
  if (clientId === undefined || clientId === null || `${clientId}`.length === 0) {
    return params;
  }
  return { ...params, clientId };
}
