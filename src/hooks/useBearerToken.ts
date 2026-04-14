import { useCallback, useEffect, useState } from "react";
import {
  BEARER_TOKEN_STORAGE_KEY,
  clearBearerToken,
  getBearerToken,
  setBearerToken,
} from "@/lib/authToken";

export function useBearerToken() {
  const [token, setTokenState] = useState<string | null>(() => getBearerToken());

  useEffect(() => {
    const sync = () => setTokenState(getBearerToken());
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === BEARER_TOKEN_STORAGE_KEY) sync();
    };
    window.addEventListener("leadflow-auth-token", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("leadflow-auth-token", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const save = useCallback((raw: string) => {
    setBearerToken(raw);
    setTokenState(getBearerToken());
  }, []);

  const clear = useCallback(() => {
    clearBearerToken();
    setTokenState(null);
  }, []);

  return {
    token,
    save,
    clear,
    hasToken: !!token,
  };
}
