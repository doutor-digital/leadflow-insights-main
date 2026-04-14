import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/endpoints/analytics";
import type { UnitMetricsParam } from "@/api/types";

export function useLeadAnalytics(leadId: string) {
  return useQuery({
    queryKey: ["lead-analytics", leadId],
    queryFn: () => analyticsApi.getLeadMetrics(leadId),
    enabled: !!leadId,
  });
}

export function useUnitLeadsMetrics(params: UnitMetricsParam) {
  return useQuery({
    queryKey: ["unit-leads-metrics", params],
    queryFn: () => analyticsApi.getUnitLeadsMetrics(params),
    enabled: !!params.unitId,
  });
}

export function useUnitSummary(unitId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["unit-summary", unitId, startDate, endDate],
    queryFn: () => analyticsApi.getUnitSummary(unitId, startDate, endDate),
    enabled: !!unitId,
  });
}

export function useUnitAlerts(unitId: string) {
  return useQuery({
    queryKey: ["unit-alerts", unitId],
    queryFn: () => analyticsApi.getUnitAlerts(unitId),
    enabled: !!unitId,
  });
}

export function useUnitDashboardToday(unitId: string) {
  return useQuery({
    queryKey: ["unit-dashboard-today", unitId],
    queryFn: () => analyticsApi.getUnitDashboardToday(unitId),
    enabled: !!unitId,
  });
}
