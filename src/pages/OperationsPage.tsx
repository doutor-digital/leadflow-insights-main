import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CLINIC_ID } from "@/lib/config";
import { formatNumberBR } from "@/lib/format";
import { useMetricsFila } from "@/hooks/useMetrics";
import { useActiveLeads } from "@/hooks/useLeads";

const prioridadeBadge: Record<string, string> = {
  critica: "bg-destructive/15 text-destructive border-destructive/20",
  crítica: "bg-destructive/15 text-destructive border-destructive/20",
  alta: "bg-warning/15 text-warning border-warning/20",
  media: "bg-info/15 text-info border-info/20",
  média: "bg-info/15 text-info border-info/20",
  baixa: "bg-success/15 text-success border-success/20",
};

function normalizePrioridade(p: string) {
  return p?.toLowerCase() ?? "media";
}

export default function OperationsPage() {
  const clinicId = CLINIC_ID;
  const { data: fila, isPending: filaPending, isError: filaError, error: filaErr } =
    useMetricsFila(clinicId);
  const { data: active, isPending: activePending } = useActiveLeads(200);

  const emAtendimento = useMemo(() => {
    if (!active?.length) return [];
    return active.filter((l) => {
      const e = l.estado.toLowerCase();
      return e.includes("atendimento") || e.includes("serviço") || e.includes("servico");
    });
  }, [active]);

  if (!clinicId) {
    return (
      <AppLayout title="Operações" subtitle="Fila de atendimento em tempo real">
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

  if (filaError) {
    return (
      <AppLayout title="Operações" subtitle="Fila de atendimento em tempo real">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar fila</AlertTitle>
          <AlertDescription>{(filaErr as Error)?.message}</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const items = fila?.items ?? [];
  const pending = filaPending || activePending;

  return (
    <AppLayout title="Operações" subtitle="Fila de atendimento em tempo real">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pending ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{formatNumberBR(fila?.total ?? 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Na Fila</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{formatNumberBR(emAtendimento.length)}</p>
                <p className="text-sm text-muted-foreground mt-1">Em Atendimento</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-warning">{formatNumberBR(fila?.acimaSla ?? 0)}</p>
                <p className="text-sm text-muted-foreground mt-1">Acima do SLA</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Fila de Espera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending ? (
              <Skeleton className="h-40" />
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Fila vazia.</p>
            ) : (
              items.map((item) => {
                const pr = normalizePrioridade(item.prioridade);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.unidade} · {item.origem}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.tempo}</span>
                      <Badge variant="outline" className={prioridadeBadge[pr] ?? prioridadeBadge.media}>
                        {item.prioridade}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending ? (
              <Skeleton className="h-40" />
            ) : emAtendimento.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead neste estado (lista active).</p>
            ) : (
              emAtendimento.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.estado} · {item.unidade}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
