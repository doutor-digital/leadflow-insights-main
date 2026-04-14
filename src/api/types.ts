// ==================== Webhooks / Leads ====================
export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  origem: string;
  estado: string;
  unidade: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCountByState {
  state: string;
  count: number;
}

export interface EtapaAgrupada {
  etapa: string;
  quantidade: number;
}

export interface OrigemCloudia {
  origem: string;
  quantidade: number;
}

export interface ConsultaPeriodo {
  periodo: string;
  quantidade: number;
}

// ==================== Metrics ====================
export interface DashboardMetrics {
  totalLeads: number;
  convertidos: number;
  emFila: number;
  alertas: number;
  taxaConversao: number;
  atendimentosHoje: number;
  evolucaoDiaria: { dia: string; leads: number; convertidos: number }[];
  volumePorHora: { hora: string; volume: number }[];
}

export interface MetricsResumo {
  tempoMedioResposta: number;
  sla: number;
  leadsSemResposta: number;
}

export interface MetricsFila {
  total: number;
  acimaSla: number;
  items: { id: string; nome: string; tempo: string; unidade: string; origem: string; prioridade: string }[];
}

export interface MetricsCompleto {
  resumo: MetricsResumo;
  fila: MetricsFila;
  dashboard: DashboardMetrics;
}

// ==================== Units ====================
export interface Unit {
  id: string;
  clinicId: string;
  nome: string;
  quantityLeads?: number;
}

// ==================== Assignments ====================
export interface Attendant {
  id: string;
  nome: string;
  leads: number;
  conversao: number;
}

export interface AttendantRanking {
  id: string;
  nome: string;
  leads: number;
  conversao: number;
}

export interface LeadAssignment {
  leadId: string;
  attendantId: string;
  attendantName: string;
  assignedAt: string;
}

// ==================== Analytics ====================
export interface LeadMetrics {
  leadId: string;
  temposPorEstado: { estado: string; tempo: number }[];
  eventos: { tipo: string; data: string; descricao: string }[];
}

export interface UnitLeadsMetrics {
  totalLeads: number;
  convertidos: number;
  taxaConversao: number;
  tempoMedioResposta: number;
  porEstado: { estado: string; quantidade: number }[];
}

export interface UnitSummary {
  unitId: string;
  nome: string;
  totalLeads: number;
  convertidos: number;
  emFila: number;
  sla: number;
}

export interface UnitAlert {
  id: string;
  tipo: string;
  mensagem: string;
  nivel: "critical" | "warning" | "info";
  criadoEm: string;
}

export interface UnitDashboardToday {
  leadsHoje: number;
  convertidosHoje: number;
  filaAtual: number;
  tempoMedioResposta: number;
}

// ==================== Reports ====================
// PDF blob response

// ==================== Config ====================
export interface CloudiaApiKeyStatus {
  active: boolean;
  createdAt?: string;
}

// ==================== Query Params ====================
export interface ClinicIdParam {
  clinicId: string;
}

export interface DateRangeParam {
  clinicId: string;
  dataInicio: string;
  dataFim: string;
}

export interface PeriodParam {
  clinicId: string;
  ano: number;
  mes?: number;
  dia?: number;
}

export interface UnitMetricsParam {
  unitId: string;
  startDate?: string;
  endDate?: string;
  state?: string;
}
