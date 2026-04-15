import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { KpiCard, ChartCard } from "@/components/DashboardCards";
import { Users, UserCheck, Clock, AlertTriangle, TrendingUp, PhoneCall } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { FunnelCustom } from "@/components/FunnelCustom";

// ── Paleta ────────────────────────────────────────────────────────────────────
const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38,  92%, 50%)",
  "hsl(271, 81%, 66%)",
  "hsl(0,   84%, 60%)",
  "hsl(199, 89%, 48%)",
];

// ── Tooltip escuro ────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover shadow-2xl px-3 py-2 text-xs text-popover-foreground">
      {label && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="font-bold ml-auto pl-4">{formatNumberBR(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ── Eixos e grid ──────────────────────────────────────────────────────────────
const tick = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const grid = { strokeDasharray: "3 3", stroke: "hsl(var(--border))" };

// ── Helper ────────────────────────────────────────────────────────────────────
function buildStackedRows(units: Unit[], results: LeadCountByState[][]): Record<string, string | number>[] {
  const stateSet = new Set<string>();
  results.forEach((rows) => rows.forEach(({ state }) => stateSet.add(state)));
  return Array.from(stateSet).map((estado) => {
    const row: Record<string, string | number> = { estado };
    units.forEach((u, i) => { row[`u_${u.id}`] = results[i]?.find((x) => x.state === estado)?.count ?? 0; });
    return row;
  });
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg">—</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// ── Severidade dos alertas ────────────────────────────────────────────────────
const NIVEL: Record<string, { bar: string; badge: string; label: string }> = {
  critical: { bar: "border-l-4 border-red-500    bg-red-500/10    text-red-500",    badge: "bg-red-500/20    text-red-500",    label: "Crítico"  },
  warning:  { bar: "border-l-4 border-amber-500  bg-amber-500/10  text-amber-500",  badge: "bg-amber-500/20  text-amber-500",  label: "Atenção"  },
  info:     { bar: "border-l-4 border-sky-500    bg-sky-500/10    text-sky-500",    badge: "bg-sky-500/20    text-sky-500",    label: "Info"     },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const clinicId = CLINIC_ID;

  const { data: dash, isPending: dashPending, isError: dashError, error: dashErr } = useDashboardMetrics(clinicId);
  const { data: etapas }  = useEtapaAgrupada(clinicId);
  const { data: origens } = useOrigemCloudia(clinicId);
  const { data: ranking } = useAttendantRanking(clinicId);
  const { data: semPag }  = useLeadsSemPagamento(clinicId);
  const { data: comPag }  = useLeadsComPagamento(clinicId);
  const { data: units }   = useUnits();
  const { data: leads }   = useLeads();

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

  // ── memos (inalterados) ───────────────────────────────────────────────────
  const funnelData = useMemo(() => {
    if (!etapas?.length) return [];
    return etapas.map((e, i) => ({ name: e.etapa, value: e.quantidade, fill: COLORS[i % COLORS.length] }));
  }, [etapas]);

  const lineData = useMemo(() => {
    if (!dash?.evolucaoDiaria?.length) return [];
    return dash.evolucaoDiaria.map((d) => ({ dia: formatDiaChart(d.dia), leads: d.leads, convertidos: d.convertidos }));
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
    if (!a && !b) return [];
    return [{ name: "Sem pagamento", value: a }, { name: "Com pagamento", value: b }];
  }, [semPag, comPag]);

  const radarData = useMemo(() => {
    const s0 = pairSummaries[0]?.data;
    const s1 = pairSummaries[1]?.data;
    if (!s0 || !s1) return [];
    const max = (a: number, b: number) => Math.max(a, b, 1);
    return [
      { metric: "Fila",        A: (s0.emFila      / max(s0.emFila,      s1.emFila))      * 100, B: (s1.emFila      / max(s0.emFila,      s1.emFila))      * 100 },
      { metric: "Leads",       A: (s0.totalLeads  / max(s0.totalLeads,  s1.totalLeads))  * 100, B: (s1.totalLeads  / max(s0.totalLeads,  s1.totalLeads))  * 100 },
      { metric: "Convertidos", A: (s0.convertidos / max(s0.convertidos, s1.convertidos)) * 100, B: (s1.convertidos / max(s0.convertidos, s1.convertidos)) * 100 },
      { metric: "SLA",         A: s0.sla, B: s1.sla },
    ];
  }, [pairSummaries]);

  const alertItems = useMemo(() => {
    return alertQueries
      .flatMap((q) => q.data ?? [])
      .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.nivel] ?? 3) - ({ critical: 0, warning: 1, info: 2 }[b.nivel] ?? 3))
      .slice(0, 8);
  }, [alertQueries]);

  // ── guards ────────────────────────────────────────────────────────────────
  if (!clinicId) return (
    <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">
      <Alert><AlertTitle>Clínica não configurada</AlertTitle>
        <AlertDescription>Defina <code className="text-xs bg-muted px-1 rounded">VITE_CLINIC_ID</code> no <code className="text-xs bg-muted px-1 rounded">.env</code> e reinicie.</AlertDescription>
      </Alert>
    </AppLayout>
  );

  if (dashError) return (
    <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">
      <Alert variant="destructive"><AlertTitle>Erro ao carregar métricas</AlertTitle>
        <AlertDescription>{(dashErr as Error)?.message ?? "Verifique a API e o CORS."}</AlertDescription>
      </Alert>
    </AppLayout>
  );

  const taxa = dash?.taxaConversao ?? 0;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout title="Dashboard" subtitle="Visão executiva de leads e operações">

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {dashPending
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)
          : <>
              <KpiCard title="Total de Leads"      value={formatNumberBR(leads?.length ?? 0)}
                change={`${formatNumberBR(leads?.filter((l: any) => Date.now() - new Date(l.createdAt).getTime() < 6.048e8).length ?? 0)} nos últimos 7 dias`}
                changeType="neutral" icon={Users} />
              <KpiCard title="Convertidos"          value={formatNumberBR(dash?.convertidos        ?? 0)} changeType="neutral" icon={UserCheck} />
              <KpiCard title="Em Fila"              value={formatNumberBR(dash?.emFila             ?? 0)} changeType="neutral" icon={Clock} />
              <KpiCard title="Alertas"              value={formatNumberBR(dash?.alertas            ?? 0)} changeType="neutral" icon={AlertTriangle} />
              <KpiCard title="Taxa Conversão"       value={formatTaxaPct(taxa)}                           changeType="neutral" icon={TrendingUp} />
              <KpiCard title="Atendimentos Hoje"    value={formatNumberBR(dash?.atendimentosHoje   ?? 0)} changeType="neutral" icon={PhoneCall} />
            </>
        }
      </div>

      {/* ── Row 1: Funil + Linha ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Funil de Leads" description="Etapas desde a entrada até a conversão">
          {funnelData.length === 0 ? <Empty text="Sem dados de etapas." /> : <FunnelCustom data={funnelData} />}
        </ChartCard>

        <ChartCard title="Evolução Diária" description="Leads novos vs. convertidos">
          {lineData.length === 0 ? <Empty text="Sem série temporal." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="dia" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip content={<DarkTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="leads"       stroke={COLORS[0]} strokeWidth={2.5} name="Leads"       dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="convertidos" stroke={COLORS[1]} strokeWidth={2.5} name="Convertidos" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Stacked Bar + Pie ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Leads por Estado e Unidade" description="Distribuição empilhada por unidade" className="lg:col-span-2">
          {!stackedBarData.length || !units?.length ? <Empty text="Sem dados por unidade." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stackedBarData} barCategoryGap="30%">
                <CartesianGrid {...grid} />
                <XAxis dataKey="estado" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip content={<DarkTooltip />} />
                <Legend />
                {units.map((u, i) => (
                  <Bar key={u.id} dataKey={`u_${u.id}`} stackId="a"
                    fill={COLORS[i % COLORS.length]} name={u.nome}
                    radius={i === units.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Origem dos Leads" description="Distribuição por canal">
          {pieData.length === 0 ? <Empty text="Sem origens." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={95}
                  dataKey="value" paddingAngle={2}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Área + Donut + Ranking ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Volume por Hora" description="Leads recebidos ao longo do dia">
          {areaData.length === 0 ? <Empty text="Sem volume por hora." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={COLORS[5]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLORS[5]} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grid} />
                <XAxis dataKey="hora" tick={tick} />
                <YAxis tick={tick} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="volume" stroke={COLORS[5]}
                  fill="url(#gradVol)" strokeWidth={2.5} name="Volume" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Pagamento" description="Leads com vs. sem pagamento">
          {donutData.length === 0 ? <Empty text="Sem dados de pagamento." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%"
                  innerRadius={62} outerRadius={90} dataKey="value"
                  paddingAngle={4} fontSize={11}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={COLORS[1]} stroke="transparent" />
                  <Cell fill={COLORS[2]} stroke="transparent" />
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Atendentes" description="Ranking por leads concluídos">
          {rankingData.length === 0 ? <Empty text="Sem ranking." /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rankingData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid {...grid} />
                <XAxis type="number" tick={tick} />
                <YAxis type="category" dataKey="name" tick={tick} width={88} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="leads" fill={COLORS[0]} radius={[0, 6, 6, 0]} barSize={14} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Radar + Alertas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Score Operacional" description="Comparativo entre as duas primeiras unidades (normalizado)">
          {radarData.length === 0 ? <Empty text="É necessário ao menos duas unidades com resumo." /> : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={tick} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Radar name={units?.[0]?.nome ?? "Unidade A"} dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.25} />
                <Radar name={units?.[1]?.nome ?? "Unidade B"} dataKey="B" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.25} />
                <Legend />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Alertas Prioritários" description="Alertas por unidade ordenados por severidade">
          {alertItems.length === 0 ? <Empty text="Nenhum alerta ativo." /> : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
              {alertItems.map((alert) => {
                const s = NIVEL[alert.nivel] ?? NIVEL.info;
                return (
                  <div key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg text-sm transition-all ${s.bar}`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="flex-1 line-clamp-2 leading-snug">{alert.mensagem}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.badge}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

    </AppLayout>
  );
}