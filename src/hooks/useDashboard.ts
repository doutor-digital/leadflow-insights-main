import { useQuery } from "@tanstack/react-query";
import { webhooksApi } from "@/api/endpoints/webhooks";
import { assignmentsApi } from "@/api/endpoints/assignments";
import type { ConsultaPeriodo } from "@/api/types";
import { metricsApi } from "@/api/endpoints/metrics";

export function useDashboardMetrics(clinicId: string) {
  return useQuery({
    queryKey: ["dashboard-metrics", clinicId],
    queryFn: () => metricsApi.getDashboard(clinicId),
    enabled: !!clinicId,
    staleTime: 30_000,
  });
}

export function useMetricsResumo(clinicId: string) {
  return useQuery({
    queryKey: ["metrics-resumo", clinicId],
    queryFn: () => metricsApi.getResumo(clinicId),
    enabled: !!clinicId,
    staleTime: 30_000,
  });
}

export function useCountByState(unitId?: string) {
  return useQuery({
    queryKey: ["count-by-state", unitId],
    queryFn: () => webhooksApi.getCountByState(unitId),
    staleTime: 15_000,
  });
}

export function useEtapaAgrupada(clinicId: string) {
  return useQuery({
    queryKey: ["etapa-agrupada", clinicId],
    queryFn: () => webhooksApi.getEtapaAgrupada(clinicId),
    enabled: !!clinicId,
  });
}

export function useOrigemCloudia(clinicId: string) {
  return useQuery({
    queryKey: ["origem-cloudia", clinicId],
    queryFn: () => webhooksApi.getOrigemCloudia(clinicId),
    enabled: !!clinicId,
  });
}

export function useAttendantRanking(clinicId: string) {
  return useQuery({
    queryKey: ["ranking", clinicId],
    queryFn: () => assignmentsApi.getRanking(clinicId),
    enabled: !!clinicId,
  });
}

export function useConsultaPeriodos(clinicId: string, ano: number, mes?: number) {
  return useQuery({
    queryKey: ["consulta-periodos", clinicId, ano, mes],
    queryFn: () =>
      webhooksApi.consultaPeriodos({ clinicId, ano, mes }) as Promise<ConsultaPeriodo[]>,
    enabled: !!clinicId,
  });
}
