import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadsList } from "@/hooks/useLeads";
import { formatDateBR } from "@/lib/format";

const estadoBadge: Record<string, string> = {
  Bot: "bg-chart-3/15 text-warning border-warning/20",
  Fila: "bg-chart-5/15 text-destructive border-destructive/20",
  "Em Atendimento": "bg-chart-1/15 text-info border-info/20",
  Convertido: "bg-chart-2/15 text-success border-success/20",
  Concluído: "bg-chart-2/15 text-success border-success/20",
};

export default function LeadsPage() {
  const { data: leads, isPending, isError, error } = useLeadsList();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!leads?.length) return [];
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter(
      (l) =>
        l.nome.toLowerCase().includes(s) ||
        l.telefone.replace(/\D/g, "").includes(s.replace(/\D/g, ""))
    );
  }, [leads, q]);

  return (
    <AppLayout title="Leads" subtitle="Gestão e visualização de todos os leads">
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erro ao carregar leads</AlertTitle>
          <AlertDescription>{(error as Error)?.message ?? "Tente novamente."}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Lista de Leads</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                className="pl-9 w-64 h-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" type="button">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Origem</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Unidade</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{lead.nome}</td>
                      <td className="py-3 px-4">{lead.telefone}</td>
                      <td className="py-3 px-4">{lead.origem}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={estadoBadge[lead.estado] ?? ""}>
                          {lead.estado}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{lead.unidade}</td>
                      <td className="py-3 px-4">{formatDateBR(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead encontrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
