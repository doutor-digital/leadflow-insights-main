import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { KpiCard, ChartCard } from "@/components/DashboardCards";
import { Users, UserCheck, Clock, AlertTriangle, TrendingUp, PhoneCall } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC_ID } from "@/lib/config";
import { formatDiaChart, formatNumberBR, formatTaxaPct } from "@/lib/format";
import { webhooksApi } from "@/api/endpoints/webhooks";
import { analyticsApi } from "@/api/endpoints/analytics";
import type { LeadCountByState, Unit } from "@/api/types";
import {
  useDashboardMetrics,
  useEtapaAgrupada,
  useOrigemCloudia,
  useAttendantRanking,
} from "@/hooks/useDashboard";
import { useLeadsSemPagamento, useLeadsComPagamento, useLeads } from "@/hooks/useLeads";
import { useUnits } from "@/hooks/useUnits";

const COLORS = [
  "hsl(210, 78%, 42%)",
  "hsl(160, 55%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(190, 70%, 45%)",
];

function buildStackedRows(
  units: Unit[],
  results: LeadCountByState[][]
): Record<string, string | number>[] {
  const stateSet = new Set<string>();
  results.forEach((rows) => rows.forEach(({ state }) => stateSet.add(state)));
  const estados = Array.from(stateSet);
  return estados.map((estado) => {
    const row: Record<string, string | number> = { estado };
    units.forEach((u, i) => {
      const key = `u_${u.id}`;
      row[key] = results[i]?.find((x) => x.state === estado)?.count ?? 0;
    });
    return row;
  });
}

export default function Dashboard() {
  const clinicId = CLINIC_ID;

  const { data: dash, isPending: dashPending, isError: dashError, error: dashErr } =
    useDashboardMetrics(clinicId);
  const { data: etapas } = useEtapaAgrupada(clinicId);
  const { data: origens } = useOrigemCloudia(clinicId);
  const { data: ranking } = useAttendantRanking(clinicId);
  const { data: semPag } = useLeadsSemPagamento(clinicId);
  const { data: comPag } = useLeadsComPagamento(clinicId);
  const { data: units } = useUnits();
  const { data: leads, isPending, isError } = useLeads();


  const countQueries = useQueries({
    queries: (units ?? []).map((u) => ({
      queryKey: ["count-by-state", u.id],
      queryFn: () => webhooksApi.getCountByState(u.id),
      enabled: !!clinicId && !!units?.length,
    })),
  });

  const pairSummaries = useQueries({
    queries: (units ?? []).slice(0, 2).map((u) => ({
      queryKey: ["unit-summary-dash", u.id],
      queryFn: () => analyticsApi.getUnitSummary(u.id),
      enabled: !!clinicId && (units?.length ?? 0) >= 1,
    })),
  });

  const alertQueries = useQueries({
    queries: (units ?? []).slice(0, 10).map((u) => ({
      queryKey: ["unit-alerts-dash", u.id],
      queryFn: () => analyticsApi.getUnitAlerts(u.id),
      enabled: !!clinicId && !!units?.length,
    })),
  });

  const funnelData = useMemo(() => {
    if (!etapas?.length) return [];
    return etapas.map((e, i) => ({
      name: e.etapa,
      value: e.quantidade,
      fill: COLORS[i % COLORS.length],
    }));
  }, [etapas]);

  const lineData = useMemo(() => {
    if (!dash?.evolucaoDiaria?.length) return [];
    return dash.evolucaoDiaria.map((d) => ({
      dia: formatDiaChart(d.dia),
      leads: d.leads,
      convertidos: d.convertidos,
    }));
  }, [dash?.evolucaoDiaria]);

  const stackedBarData = useMemo(() => {
    const results = countQueries.map((q) => q.data ?? []);
    if (!units?.length || !results.some((r) => r.length)) return [];
    return buildStackedRows(units, results);
  }, [units, countQueries]);

  const pieData = useMemo(() => {
    if (!origens?.length) return [];
    return origens.map((o) => ({ name: o.origem, value: o.quantidade }));
  }, [origens]);

  const areaData = useMemo(() => {
    if (!dash?.volumePorHora?.length) return [];
    return dash.volumePorHora.map((v) => ({ hora: v.hora, volume: v.volume }));
  }, [dash?.volumePorHora]);

  const rankingData = useMemo(() => {
    if (!ranking?.length) return [];
    return [...ranking].reverse().map((r) => ({ name: r.nome, leads: r.leads }));
  }, [ranking]);

  const donutData = useMemo(() => {
    const a = semPag?.length ?? 0;
    const b = comPag?.length ?? 0;
    if (a === 0 && b === 0) return [];
    return [
      { name: "Sem pagamento", value: a },
      { name: "Com pagamento", value: b },
    ];
  }, [semPag, comPag]);

  const radarData = useMemo(() => {
    const s0 = pairSummaries[0]?.data;
    const s1 = pairSummaries[1]?.data;
    if (!s0 || !s1) return [];
    const max = (a: number, b: number) => Math.max(a, b, 1);
    return [
      {
        metric: "Fila",
        A: (s0.emFila / max(s0.emFila, s1.emFila)) * 100,
        B: (s1.emFila / max(s0.emFila, s1.emFila)) * 100,
      },
      {
        metric: "Leads",
        A: (s0.totalLeads / max(s0.totalLeads, s1.totalLeads)) * 100,
        B: (s1.totalLeads / max(s0.totalLeads, s1.totalLeads)) * 100,
      },
      {
        metric: "Convertidos",
        A: (s0.convertidos / max(s0.convertidos, s1.convertidos)) * 100,
        B: (s1.convertidos / max(s0.convertidos, s1.convertidos)) * 100,
      },
      {
        metric: "SLA",
        A: s0.sla,
        B: s1.sla,
      },
    ];
  }, [pairSummaries]);

  const alertItems = useMemo(() => {
    const flat = alertQueries.flatMap((q) => q.data ?? []);
    return flat
      .sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return (order[a.nivel] ?? 3) - (order[b.nivel] ?? 3);
      })
      .slice(0, 8);
  }, [alertQueries]);

  if (!clinicId) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">
        <Alert>
          <AlertTitle>Clínica não configurada</AlertTitle>
          <AlertDescription>
            Defina <code className="text-xs bg-muted px-1 rounded">VITE_CLINIC_ID</code> no ficheiro{" "}
            <code className="text-xs bg-muted px-1 rounded">.env</code> e reinicie o servidor de
            desenvolvimento.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  if (dashError) {
    return (
      <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar métricas</AlertTitle>
          <AlertDescription>
            {(dashErr as Error)?.message ?? "Verifique a API e o CORS."}
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const taxa = dash?.taxaConversao ?? 0;

  return (
    <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {dashPending ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-lg" />
          ))
        ) : (
          <>
           <KpiCard
              title="Total de Leads"
              value={formatNumberBR(leads?.length ?? 0)}
              change={`${formatNumberBR(
                leads?.filter((l: { createdAt: string | number | Date; }) => {
                  const d = new Date(l.createdAt);
                  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
                }).length ?? 0
              )} chegaram nos últimos 7 dias`}
              changeType="neutral"
              icon={Users}
            />
            <KpiCard
              title="Convertidos"
              value={formatNumberBR(dash?.convertidos ?? 0)}
              changeType="neutral"
              icon={UserCheck}
            />
            <KpiCard
              title="Em Fila"
              value={formatNumberBR(dash?.emFila ?? 0)}
              changeType="neutral"
              icon={Clock}
            />
            <KpiCard
              title="Alertas"
              value={formatNumberBR(dash?.alertas ?? 0)}
              changeType="neutral"
              icon={AlertTriangle}
            />
            <KpiCard
              title="Taxa Conversão"
              value={formatTaxaPct(taxa)}
              changeType="neutral"
              icon={TrendingUp}
            />
            <KpiCard
              title="Atendimentos Hoje"
              value={formatNumberBR(dash?.atendimentosHoje ?? 0)}
              changeType="neutral"
              icon={PhoneCall}
            />
          </>
        )}
      </div>

      {/* Row 1: Funnel + Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Funil de Leads" description="Etapas do lead desde a entrada até conversão">
          {funnelData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de etapas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="hsl(0,0%,20%)" stroke="none" dataKey="name" fontSize={12} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Evolução Diária" description="Leads novos vs convertidos (período da API)">
          {lineData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem série temporal.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke={COLORS[0]} strokeWidth={2} name="Leads" dot={false} />
                <Line type="monotone" dataKey="convertidos" stroke={COLORS[1]} strokeWidth={2} name="Convertidos" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Stacked Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Leads por Estado e Unidade" description="Distribuição empilhada" className="lg:col-span-2">
          {stackedBarData.length === 0 || !units?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem dados por unidade ou unidades não carregadas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stackedBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {units.map((u, i) => (
                  <Bar
                    key={u.id}
                    dataKey={`u_${u.id}`}
                    stackId="a"
                    fill={COLORS[i % COLORS.length]}
                    name={u.nome}
                    radius={i === units.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Origem dos Leads" description="Distribuição por canal">
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem origens.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Area + Donut + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Volume por Hora" description="Leads recebidos ao longo do dia">
          {areaData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem volume por hora.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="volume" stroke={COLORS[5]} fill={COLORS[5]} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Pagamento" description="Leads com vs sem pagamento (amostras da API)">
          {donutData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de pagamento.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={11}
                >
                  <Cell fill={COLORS[1]} />
                  <Cell fill={COLORS[2]} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Atendentes" description="Ranking por leads concluídos">
          {rankingData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem ranking.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rankingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="leads" fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Score Operacional" description="Comparativo entre as duas primeiras unidades (normalizado)">
          {radarData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              É necessário pelo menos duas unidades com resumo.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(210,15%,90%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar name={units?.[0]?.nome ?? "A"} dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                <Radar name={units?.[1]?.nome ?? "B"} dataKey="B" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Alertas Prioritários" description="Alertas por unidade (API analytics)">
          {alertItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum alerta ativo.</p>
          ) : (
            <div className="space-y-3">
              {alertItems.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-md text-sm ${
                    alert.nivel === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : alert.nivel === "warning"
                        ? "bg-warning/10 text-warning"
                        : "bg-info/10 text-info"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{alert.mensagem}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </AppLayout>
  );
}
