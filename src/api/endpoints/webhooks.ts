import { apiClient } from "../client";
import type {
  Lead, LeadCountByState, EtapaAgrupada, OrigemCloudia,
  ClinicIdParam, DateRangeParam, PeriodParam,
} from "../types";

export const webhooksApi = {
  getAll: () =>
    apiClient.get<Lead[]>("/webhooks").then((r) => r.data),

  getConsultas: (clinicId: string) =>
    apiClient.get<Lead[]>(`/webhooks/consultas?clinicId=${clinicId}`).then((r) => r.data),

  getSemPagamento: (clinicId: string) =>
    apiClient.get<Lead[]>(`/webhooks/sem-pagamento?clinicId=${clinicId}`).then((r) => r.data),

  getComPagamento: (clinicId: string) =>
    apiClient.get<Lead[]>(`/webhooks/com-pagamento?clinicId=${clinicId}`).then((r) => r.data),

  getSourceFinal: (clinicId: string) =>
    apiClient.get(`/webhooks/source-final?clinicId=${clinicId}`).then((r) => r.data),

  getOrigemCloudia: (clinicId: string) =>
    apiClient.get<OrigemCloudia[]>(`/webhooks/origem-cloudia?clinicId=${clinicId}`).then((r) => r.data),

  getFimDeSemana: (clinicId: string) =>
    apiClient.get(`/webhooks/fim-de-semana?clinicId=${clinicId}`).then((r) => r.data),

  getEtapaAgrupada: (clinicId: string) =>
    apiClient.get<EtapaAgrupada[]>(`/webhooks/etapa-agrupada?clinicId=${clinicId}`).then((r) => r.data),

  buscarIniFim: (params: DateRangeParam) =>
    apiClient.get<Lead[]>(`/webhooks/buscar-inicio-fim?clinicId=${params.clinicId}&dataInicio=${params.dataInicio}&dataFim=${params.dataFim}`).then((r) => r.data),

  consultaPeriodos: (params: PeriodParam) => {
    const qs = new URLSearchParams({ clinicId: params.clinicId, ano: String(params.ano) });
    if (params.mes) qs.set("mes", String(params.mes));
    if (params.dia) qs.set("dia", String(params.dia));
    return apiClient.get(`/webhooks/consulta-periodos?${qs}`).then((r) => r.data);
  },

  getActive: (limit = 100, unitId?: string) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (unitId) qs.set("unitId", unitId);
    return apiClient.get<Lead[]>(`/webhooks/active?${qs}`).then((r) => r.data);
  },

  getCountByState: (unitId?: string) => {
    const qs = unitId ? `?unitId=${unitId}` : "";
    return apiClient.get<LeadCountByState[]>(`/webhooks/count-by-state${qs}`).then((r) => r.data);
  },

  getSyncHealth: () =>
    apiClient.get("/webhooks/sync/health").then((r) => r.data),
};
