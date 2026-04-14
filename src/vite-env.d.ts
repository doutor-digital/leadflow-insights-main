/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** ID da clínica para métricas, webhooks com filtro, relatórios, etc. */
  readonly VITE_CLINIC_ID?: string;
  /** Chave para endpoints de administração da API Cloudia. */
  readonly VITE_ADMIN_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
