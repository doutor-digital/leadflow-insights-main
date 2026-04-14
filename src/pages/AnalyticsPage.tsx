import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ChartCard } from "@/components/DashboardCards";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC_ID } from "@/lib/config";
import { formatDiaChart } from "@/lib/format";
import { analyticsApi } from "@/api/endpoints/analytics";
import { webhooksApi } from "@/api/endpoints/webhooks";
import { useUnits } from "@/hooks/useUnits";
import { useDashboardMetrics, useConsultaPeriodos } from "@/hooks/useDashboard";

const COLORS = [
  "hsl(210, 78%, 42%)",
  "hsl(160, 55%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
];

function rangeLast30d() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function AnalyticsPage() {
  const clinicId = CLINIC_ID;
  const { data: units } = useUnits();
  const { startDate, endDate } = useMemo(() => rangeLast30d(), []);

  const { data: dash, isPending: dashPending } = useDashboardMetrics(clinicId);
  const now = new Date();
  const { data: periodoAtual } = useConsultaPeriodos(clinicId, now.getFullYear(), now.getMonth() + 1);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const { data: periodoAnterior } = useConsultaPeriodos(clinicId, prev.getFullYear(), prev.getMonth() + 1);

  const unitMetricsQueries = useQueries({
    queries: (units ?? []).map((u) => ({
      queryKey: ["unit-leads-metrics", u.id, startDate, endDate],
      queryFn: () =>
        analyticsApi.getUnitLeadsMetrics({
          unitId: u.id,
          startDate,
          endDate,
        }),
      enabled: !!clinicId && !!units?.length,
    })),
  });

  const countByState = useQuery({
    queryKey: ["count-by-state-analytics"],
    queryFn: () => webhooksApi.getCountByState(),
    staleTime: 30_000,
    enabled: !!clinicId,
  });

  const lineData = useMemo(() => {
    if (!dash?.evolucaoDiaria?.length) return [];
    return dash.evolucaoDiaria.map((d) => ({
      dia: formatDiaChart(d.dia),
      leads: d.leads,
      convertidos: d.convertidos,
    }));
  }, [dash?.evolucaoDiaria]);

  const unitCompare = useMemo(() => {
    return unitMetricsQueries.map((q, i) => {
      const u = units?.[i];
      const m = q.data;
      if (!u || !m) return null;
      return {
        unidade: u.nome,
        conversao: m.taxaConversao,
        tempo: m.tempoMedioResposta,
        volume: m.totalLeads,
      };
    }).filter(Boolean) as { unidade: string; conversao: number; tempo: number; volume: number }[];
  }, [unitMetricsQueries, units]);

  const scatterData = useMemo(
    () =>
      unitCompare.map((u) => ({
        x: u.tempo,
        y: u.conversao,
        z: u.volume,
        name: u.unidade,
      })),
    [unitCompare]
  );

  const periodCompare = useMemo(() => {
    const a = Array.isArray(periodoAtual) ? periodoAtual : [];
    const b = Array.isArray(periodoAnterior) ? periodoAnterior : [];
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return [];
    const rows: { periodo: string; atual: number; anterior: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        periodo: a[i]?.periodo ?? b[i]?.periodo ?? `P${i + 1}`,
        atual: a[i]?.quantidade ?? 0,
        anterior: b[i]?.quantidade ?? 0,
      });
    }
    return rows;
  }, [periodoAtual, periodoAnterior]);

  const metricsEstado = useMemo(() => {
    const rows = countByState.data ?? [];
    return rows.map((r) => ({
      estado: r.state,
      atual: r.count,
      anterior: 0,
    }));
  }, [countByState.data]);

  const loading =
    dashPending ||
    unitMetricsQueries.some((q) => q.isPending) ||
    countByState.isPending;

  if (!clinicId) {
    return (
      <AppLayout title="Analytics" subtitle="Análise detalhada por unidade e período">
        <Alert>
          <AlertTitle>Clínica não configurada</AlertTitle>
          <AlertDescription>
            Defina <code className="text-xs bg-muted px-1 rounded">VITE_CLINIC_ID</code> no{" "}
            <code className="text-xs bg-muted px-1 rounded">.env</code>.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics" subtitle="Análise detalhada por unidade e período">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[280px] w-full" />
          <Skeleton className="h-[280px] w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Comparativo por Unidade" description="Taxa de conversão (%) por unidade (últimos 30 dias)">
              {unitCompare.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem métricas por unidade.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={unitCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis dataKey="unidade" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip />
                    <Bar dataKey="conversao" fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={32} name="Conversão %" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Evolução (dashboard)" description="Mesma série do dashboard — leads vs convertidos">
              {lineData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem dados.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke={COLORS[0]} strokeWidth={2} name="Leads" />
                    <Line type="monotone" dataKey="convertidos" stroke={COLORS[2]} strokeWidth={2} name="Convertidos" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Tempo de Resposta vs Conversão" description="Cada ponto é uma unidade (tamanho ≈ volume)">
              {scatterData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem pontos.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis type="number" dataKey="x" name="Tempo (min)" unit="min" tick={{ fontSize: 12 }} />
                    <YAxis type="number" dataKey="y" name="Conversão" unit="%" tick={{ fontSize: 12 }} />
                    <ZAxis type="number" dataKey="z" range={[60, 300]} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={scatterData} fill={COLORS[3]} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Métricas por Estado" description="Contagem global por estado (webhooks)">
              {metricsEstado.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sem contagem por estado.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={metricsEstado}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="atual" fill={COLORS[0]} name="Quantidade" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {periodCompare.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mt-4">
              <ChartCard title="Consulta por períodos (mês atual vs anterior)" description="Dados de /webhooks/consulta-periodos">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={periodCompare}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="atual" stroke={COLORS[0]} strokeWidth={2} name="Mês atual" />
                    <Line type="monotone" dataKey="anterior" stroke={COLORS[1]} strokeWidth={2} strokeDasharray="5 5" name="Mês anterior" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
