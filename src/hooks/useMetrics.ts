import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "@/api/endpoints/metrics";

export function useMetricsFila(clinicId: string) {
  return useQuery({
    queryKey: ["metrics-fila", clinicId],
    queryFn: () => metricsApi.getFila(clinicId),
    enabled: !!clinicId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMetricsCompleto(clinicId: string) {
  return useQuery({
    queryKey: ["metrics-completo", clinicId],
    queryFn: () => metricsApi.getCompleto(clinicId),
    enabled: !!clinicId,
  });
}
