import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsApi } from "@/api/endpoints/reports";
import { useUnits } from "@/hooks/useUnits";
import { CLINIC_ID } from "@/lib/config";
import { toast } from "sonner";

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function ReportsPage() {
  const { data: units, isPending: unitsPending } = useUnits();
  const [unitId, setUnitId] = useState<string>("");
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const reportClinicId = useMemo(() => {
    const u = units?.find((x) => x.id === unitId);
    if (u) return u.clinicId || u.id;
    return CLINIC_ID;
  }, [units, unitId]);

  const download = useMutation({
    mutationFn: () => reportsApi.getMonthlyPdf(reportClinicId, mes, ano),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${mes}-${ano}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download iniciado.");
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Falha ao gerar relatório.");
    },
  });

  const canSubmit = !!reportClinicId && !download.isPending;

  return (
    <AppLayout title="Relatórios" subtitle="Geração e download de relatórios mensais">
      {!CLINIC_ID && !unitId && (
        <Alert className="mb-4">
          <AlertTitle>Clínica</AlertTitle>
          <AlertDescription>
            Escolha uma unidade abaixo ou defina <code className="text-xs bg-muted px-1 rounded">VITE_CLINIC_ID</code>{" "}
            no <code className="text-xs bg-muted px-1 rounded">.env</code> para usar relatório sem selecionar unidade.
          </AlertDescription>
        </Alert>
      )}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Relatório Mensal PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione a unidade (opcional se já tiver clínica no env), mês e ano. O pedido usa{" "}
            <code className="text-xs bg-muted px-1 rounded">/api/relatorios/mensal</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Select
              value={unitId || "__default__"}
              onValueChange={(v) => setUnitId(v === "__default__" ? "" : v)}
              disabled={unitsPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={unitsPending ? "A carregar…" : "Unidade (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Usar clínica do .env</SelectItem>
                {(units ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[ano, ano - 1, ano - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="gap-2"
            disabled={!canSubmit}
            onClick={() => download.mutate()}
          >
            {download.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
