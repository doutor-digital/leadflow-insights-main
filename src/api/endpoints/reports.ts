import { apiClient } from "../client";

export const reportsApi = {
  getMonthlyPdf: (clinicId: string, mes: number, ano: number) =>
    apiClient.get(`/api/relatorios/mensal?clinicId=${clinicId}&mes=${mes}&ano=${ano}`, {
      responseType: "blob",
    }).then((r) => r.data as Blob),
};
