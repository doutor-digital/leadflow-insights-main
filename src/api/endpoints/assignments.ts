import { apiClient } from "../client";
import type { Attendant, AttendantRanking, LeadAssignment } from "../types";

export const assignmentsApi = {
  getAttendants: () =>
    apiClient.get<Attendant[]>("/assignments/attendants").then((r) => r.data),

  getLeadAssignment: (externalLeadId: string, clinicId: string) =>
    apiClient.get<LeadAssignment>(`/assignments/lead/${externalLeadId}?clinicId=${clinicId}`).then((r) => r.data),

  getRanking: (clinicId: string) =>
    apiClient.get<AttendantRanking[]>(`/assignments/ranking?clinicId=${clinicId}`).then((r) => r.data),

  sync: () =>
    apiClient.post("/assignments/sync").then((r) => r.data),
};
