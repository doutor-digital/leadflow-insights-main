/** ID da clínica usado nas rotas que exigem `clinicId`. Defina em `.env` como `VITE_CLINIC_ID`. */
export const CLINIC_ID = import.meta.env.VITE_CLINIC_ID ?? "";

/** Chave admin para `/api/config/*`. Defina como `VITE_ADMIN_KEY` no `.env`. */
export const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "";
