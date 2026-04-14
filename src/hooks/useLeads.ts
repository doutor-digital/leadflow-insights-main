import { useQuery } from "@tanstack/react-query";
import { webhooksApi } from "@/api/endpoints/webhooks";
import { CLINIC_ID } from "@/lib/config";

/** Lista de leads: com `VITE_CLINIC_ID` usa consultas por clínica; senão lista global. */
export function useLeadsList() {
  return useQuery({
    queryKey: ["leads", "all", CLINIC_ID || "no-clinic"],
    queryFn: () => webhooksApi.getAll(),
    staleTime: 30_000,
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => webhooksApi.getAll(),
    staleTime: 30_000,
  });
}

export function useActiveLeads(limit = 100, unitId?: string) {
  return useQuery({
    queryKey: ["active-leads", limit, unitId],
    queryFn: () => webhooksApi.getActive(limit, unitId),
    staleTime: 15_000,
  });
}

export function useLeadsByPeriod(clinicId: string, dataInicio: string, dataFim: string) {
  return useQuery({
    queryKey: ["leads-period", clinicId, dataInicio, dataFim],
    queryFn: () => webhooksApi.buscarIniFim({ clinicId, dataInicio, dataFim }),
    enabled: !!clinicId && !!dataInicio && !!dataFim,
  });
}

export function useLeadsSemPagamento(clinicId: string) {
  return useQuery({
    queryKey: ["leads-sem-pagamento", clinicId],
    queryFn: () => webhooksApi.getSemPagamento(clinicId),
    enabled: !!clinicId,
  });
}

export function useLeadsComPagamento(clinicId: string) {
  return useQuery({
    queryKey: ["leads-com-pagamento", clinicId],
    queryFn: () => webhooksApi.getComPagamento(clinicId),
    enabled: !!clinicId,
  });
}
