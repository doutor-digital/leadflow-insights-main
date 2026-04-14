import { apiClient } from "../client";
import type {
  LeadMetrics, UnitLeadsMetrics, UnitSummary, UnitAlert,
  UnitDashboardToday, UnitMetricsParam,
} from "../types";

export const analyticsApi = {
  getLeadMetrics: (leadId: string) =>
    apiClient.get<LeadMetrics>(`/api/analytics/leads/${leadId}/metrics`).then((r) => r.data),

  getUnitLeadsMetrics: (params: UnitMetricsParam) => {
    const qs = new URLSearchParams();
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.state) qs.set("state", params.state);
    return apiClient.get<UnitLeadsMetrics>(`/api/analytics/units/${params.unitId}/leads-metrics?${qs}`).then((r) => r.data);
  },

  getUnitSummary: (unitId: string, startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set("startDate", startDate);
    if (endDate) qs.set("endDate", endDate);
    return apiClient.get<UnitSummary>(`/api/analytics/units/${unitId}/summary?${qs}`).then((r) => r.data);
  },

  getUnitAlerts: (unitId: string) =>
    apiClient.get<UnitAlert[]>(`/api/analytics/units/${unitId}/alerts`).then((r) => r.data),

  getUnitDashboardToday: (unitId: string) =>
    apiClient.get<UnitDashboardToday>(`/api/analytics/units/${unitId}/dashboard/today`).then((r) => r.data),
};
