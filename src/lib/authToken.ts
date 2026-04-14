export const BEARER_TOKEN_STORAGE_KEY = "leadflow_api_bearer_token";

export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(BEARER_TOKEN_STORAGE_KEY);
  return v?.trim() ? v.trim() : null;
}

/** Aceita colar "Bearer xxx" ou só o token. */
export function normalizeTokenInput(raw: string): string {
  return raw.trim().replace(/^Bearer\s+/i, "");
}

export function setBearerToken(raw: string): void {
  const token = normalizeTokenInput(raw);
  if (token) localStorage.setItem(BEARER_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(BEARER_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("leadflow-auth-token"));
}

export function clearBearerToken(): void {
  localStorage.removeItem(BEARER_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("leadflow-auth-token"));
}
