import { useQuery } from "@tanstack/react-query";
import { unitsApi } from "@/api/endpoints/units";

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: () => unitsApi.getAll(),
    staleTime: 60_000,
  });
}

export function useUnit(clinicId: string) {
  return useQuery({
    queryKey: ["unit", clinicId],
    queryFn: () => unitsApi.getById(clinicId),
    enabled: !!clinicId,
  });
}
