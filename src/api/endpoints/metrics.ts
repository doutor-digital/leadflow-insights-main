import { apiClient } from "../client";
import type { DashboardMetrics, MetricsResumo, MetricsFila, MetricsCompleto } from "../types";

export const metricsApi = {
  getDashboard: (clinicId: string, attendantType = "HUMAN") =>
    apiClient.get<DashboardMetrics>(`/metrics/dashboard?clinicId=${clinicId}&attendantType=${attendantType}`).then((r) => r.data),

  getResumo: (clinicId: string) =>
    apiClient.get<MetricsResumo>(`/metrics/resumo?clinicId=${clinicId}`).then((r) => r.data),

  getFila: (clinicId: string) =>
    apiClient.get<MetricsFila>(`/metrics/fila?clinicId=${clinicId}`).then((r) => r.data),

  getCompleto: (clinicId: string) =>
    apiClient.get<MetricsCompleto>(`/metrics/completo?clinicId=${clinicId}`).then((r) => r.data),
};
