import { apiClient } from "../client";
import type { Unit } from "../types";

export const unitsApi = {
  getAll: () =>
    apiClient.get<Unit[]>("/units").then((r) => r.data),

  getById: (clinicId: string) =>
    apiClient.get<Unit>(`/units/${clinicId}`).then((r) => r.data),

  update: (clinicId: string, body: string) =>
    apiClient.put(`/units/${clinicId}`, body).then((r) => r.data),

  getQuantityLeads: (clinicId: string) =>
    apiClient.get(`/units/quantity-leads?clinicId=${clinicId}`).then((r) => r.data),
};
