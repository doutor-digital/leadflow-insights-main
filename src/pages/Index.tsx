import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ChartCard, KpiCard } from "@/components/DashboardCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/useLeads";
import { formatDateBR, formatNumberBR, formatTaxaPct } from "@/lib/format";
import type { Lead } from "@/api/types";
import {
  Users,
  TrendingUp,
  Clock3,
  Sparkles,
  Activity,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "hsl(14 90% 56%)",
  "hsl(198 79% 45%)",
  "hsl(160 63% 36%)",
  "hsl(42 96% 55%)",
  "hsl(340 72% 52%)",
  "hsl(262 58% 57%)",
];

const CONVERTED_STATES = ["convertido", "concluido", "fechado", "ganho", "vendido"];
const ACTIVE_STATES = ["fila", "em atendimento", "atendimento", "aguardando", "novo", "bot"];

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isRecentDays(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const now = startOfDay(new Date());
  const diff = now.getTime() - startOfDay(date).getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function buildDailyData(leads: Lead[], days: number) {
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - index - 1));
    const key = day.toISOString().slice(0, 10);
    return {
      key,
      dia: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: 0,
      convertidos: 0,
    };
  });

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  leads.forEach((lead) => {
    const createdAt = new Date(lead.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;
    const createdKey = createdAt.toISOString().slice(0, 10);
    if (createdKey && bucketByKey.has(createdKey)) {
      bucketByKey.get(createdKey)!.leads += 1;
      if (CONVERTED_STATES.some((state) => normalizeText(lead.estado).includes(state))) {
        bucketByKey.get(createdKey)!.convertidos += 1;
      }
    }
  });

  return buckets;
}

function sortByCountDesc<T extends { value: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.value - a.value);
}

function getLeadName(lead: Lead) {
  return lead.nome?.trim() || "Lead sem nome";
}

function getBadgeClass(estado: string) {
  const value = normalizeText(estado);
  if (CONVERTED_STATES.some((state) => value.includes(state))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("fila") || value.includes("aguard")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("atendimento")) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function Dashboard() {
  const { data: leads, isPending, isError, error } = useLeads();

  const dashboard = useMemo(() => {
    const list = leads ?? [];
    const totalLeads = list.length;
    const converted = list.filter((lead) =>
      CONVERTED_STATES.some((state) => normalizeText(lead.estado).includes(state))
    ).length;
    const active = list.filter((lead) =>
      ACTIVE_STATES.some((state) => normalizeText(lead.estado).includes(state))
    ).length;
    const recentLeads = list.filter((lead) => isRecentDays(lead.createdAt, 7)).length;
    const uniqueSources = new Set(
      list.map((lead) => lead.origem?.trim()).filter(Boolean)
    ).size;
    const conversionRate = totalLeads ? (converted / totalLeads) * 100 : 0;

    const sourceMap = new Map<string, number>();
    const unitMap = new Map<string, number>();
    const stageMap = new Map<string, number>();

    list.forEach((lead) => {
      const source = lead.origem?.trim() || "Sem origem";
      const unit = lead.unidade?.trim() || "Sem unidade";
      const stage = lead.estado?.trim() || "Sem etapa";
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
      unitMap.set(unit, (unitMap.get(unit) ?? 0) + 1);
      stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1);
    });

    const sourceData = sortByCountDesc(
      Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }))
    ).slice(0, 6);

    const unitData = sortByCountDesc(
      Array.from(unitMap.entries()).map(([name, value]) => ({ name, value }))
    ).slice(0, 8);

    const funnelData = sortByCountDesc(
      Array.from(stageMap.entries()).map(([name, value], index) => ({
        name,
        value,
        fill: COLORS[index % COLORS.length],
      }))
    );

    const lineData = buildDailyData(list, 14);

    const latestLeads = [...list]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    const topStage = funnelData[0];

    return {
      totalLeads,
      converted,
      active,
      recentLeads,
      uniqueSources,
      conversionRate,
      sourceData,
      unitData,
      funnelData,
      lineData,
      latestLeads,
      topStage,
    };
  }, [leads]);

  return (
    <AppLayout title="Funil de Leads" subtitle="Painel conectado ao endpoint /webhooks com leitura total dos leads">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(255,244,232,0.9)_35%,_rgba(236,246,255,0.88)_100%)] p-6 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.45)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),_transparent_58%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-4">
              <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                Dashboard principal
              </Badge>
              <div className="space-y-3">
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  Seu funil agora usa a rota <code>/webhooks</code> como fonte principal.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  O total de leads, a evolução diária, as etapas, as origens e a distribuição por
                  unidade passam a ser calculados a partir dos leads reais retornados pela sua API.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Últimos 7 dias</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {isPending ? "--" : formatNumberBR(dashboard.recentLeads)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Canais ativos</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {isPending ? "--" : formatNumberBR(dashboard.uniqueSources)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Etapa dominante</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {isPending ? "--" : dashboard.topStage?.name ?? "Sem etapa"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200/80 bg-slate-950 px-5 py-5 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.95)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Resumo rápido</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Pulso do funil</h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                  <Activity className="h-5 w-5 text-orange-300" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Leads totais", formatNumberBR(dashboard.totalLeads)],
                  ["Convertidos", formatNumberBR(dashboard.converted)],
                  ["Em andamento", formatNumberBR(dashboard.active)],
                  ["Taxa de conversão", formatTaxaPct(dashboard.conversionRate)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-lg font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar a API</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message ??
                "Não foi possível consultar /webhooks. Verifique VITE_API_BASE_URL, CORS e o token Bearer na barra lateral."}
            </AlertDescription>
          </Alert>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isPending ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[124px] rounded-[24px]" />
            ))
          ) : (
            <>
              <KpiCard
                title="Total de Leads"
                value={formatNumberBR(dashboard.totalLeads)}
                change={`${formatNumberBR(dashboard.recentLeads)} chegaram nos últimos 7 dias`}
                changeType="neutral"
                icon={Users}
              />
              <KpiCard
                title="Convertidos"
                value={formatNumberBR(dashboard.converted)}
                change={`${formatTaxaPct(dashboard.conversionRate)} do volume total`}
                changeType="positive"
                icon={TrendingUp}
              />
              <KpiCard
                title="Em Andamento"
                value={formatNumberBR(dashboard.active)}
                change="Leads ainda em fila ou atendimento"
                changeType="neutral"
                icon={Clock3}
              />
              <KpiCard
                title="Origens Ativas"
                value={formatNumberBR(dashboard.uniqueSources)}
                change="Canais identificados na sua base"
                changeType="neutral"
                icon={Sparkles}
              />
            </>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <ChartCard
            title="Evolução recente"
            description="Leads criados e quantos já estão em estado convertido nos últimos 14 dias"
          >
            {isPending ? (
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : dashboard.lineData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem dados recentes para montar a linha.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard.lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="rgba(100, 116, 139, 0.8)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="rgba(100, 116, 139, 0.8)" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke={COLORS[1]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    name="Entradas"
                  />
                  <Line
                    type="monotone"
                    dataKey="convertidos"
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    name="Convertidos"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Últimos leads" description="Os registros mais recentes recebidos pela API">
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : dashboard.latestLeads.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum lead retornado por <code>/webhooks</code>.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard.latestLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{getLeadName(lead)}</p>
                      <p className="truncate text-sm text-slate-500">
                        {lead.origem || "Sem origem"} • {lead.unidade || "Sem unidade"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getBadgeClass(lead.estado)}>
                        {lead.estado || "Sem etapa"}
                      </Badge>
                      <p className="mt-2 text-xs text-slate-500">{formatDateBR(lead.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Funil por etapa"
            description="Distribuição calculada diretamente pelo campo de estado do lead"
          >
            {isPending ? (
              <Skeleton className="h-[320px] w-full rounded-2xl" />
            ) : dashboard.funnelData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem etapas disponíveis para exibir o funil.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={dashboard.funnelData} isAnimationActive>
                    <LabelList
                      position="right"
                      fill="hsl(222 47% 11%)"
                      stroke="none"
                      dataKey="name"
                      fontSize={12}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Principais origens"
            description="Canais que mais abastecem o funil no retorno de /webhooks"
          >
            {isPending ? (
              <Skeleton className="h-[320px] w-full rounded-2xl" />
            ) : dashboard.sourceData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem origens suficientes para o gráfico.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dashboard.sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={110}
                    dataKey="value"
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {dashboard.sourceData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
          <ChartCard
            title="Leads por unidade"
            description="Onde o volume está concentrado dentro da operação"
          >
            {isPending ? (
              <Skeleton className="h-[300px] w-full rounded-2xl" />
            ) : dashboard.unitData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem unidades identificadas nos leads.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.unitData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="rgba(100, 116, 139, 0.8)" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={112}
                    tick={{ fontSize: 12 }}
                    stroke="rgba(100, 116, 139, 0.8)"
                  />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={20}>
                    {dashboard.unitData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Leitura operacional"
            description="Resumo do que o time precisa enxergar primeiro"
          >
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    title: "Taxa atual",
                    value: formatTaxaPct(dashboard.conversionRate),
                    text: "Proporção de leads já marcados como convertidos ou concluídos.",
                  },
                  {
                    title: "Em andamento",
                    value: formatNumberBR(dashboard.active),
                    text: "Leads ainda em fila, bot, aguardando ou atendimento.",
                  },
                  {
                    title: "Canal líder",
                    value: dashboard.sourceData[0]?.name ?? "Sem dados",
                    text: "Origem com maior volume dentro da base retornada.",
                  },
                  {
                    title: "Maior etapa",
                    value: dashboard.topStage?.name ?? "Sem etapa",
                    text: "Estado que hoje concentra mais leads no funil.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-slate-200/70 bg-white/85 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        <CircleDot className="h-4 w-4 text-orange-500" />
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-[22px] border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                  <div className="flex items-center gap-2 font-medium">
                    <ArrowRight className="h-4 w-4" />
                    Próximo passo recomendado
                  </div>
                  <p className="mt-2 leading-6">
                    Se a API responder, esse painel já mostra o volume real. O próximo ajuste ideal
                    é alinhar os nomes de <code>estado</code> vindos do backend para medir conversão
                    com ainda mais precisão.
                  </p>
                </div>
              </div>
            )}
          </ChartCard>
        </section>
      </div>
    </AppLayout>
  );
}
