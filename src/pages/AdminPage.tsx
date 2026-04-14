import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { configApi } from "@/api/endpoints/config";
import { ADMIN_KEY } from "@/lib/config";
import { toast } from "sonner";

export default function AdminPage() {
  const [novaKey, setNovaKey] = useState("");

  const statusQuery = useQuery({
    queryKey: ["cloudia-api-key-status"],
    queryFn: () => configApi.getCloudiaApiKeyStatus(ADMIN_KEY),
    enabled: !!ADMIN_KEY,
  });

  const saveMutation = useMutation({
    mutationFn: (apiKey: string) => configApi.setCloudiaApiKey(apiKey, ADMIN_KEY),
    onSuccess: () => {
      toast.success("API Key guardada.");
      setNovaKey("");
      statusQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao guardar."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => configApi.deleteCloudiaApiKey(ADMIN_KEY),
    onSuccess: () => {
      toast.success("Chave revogada.");
      statusQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao revogar."),
  });

  if (!ADMIN_KEY) {
    return (
      <AppLayout title="Admin" subtitle="Configurações do sistema">
        <Alert>
          <AlertTitle>Chave de administração</AlertTitle>
          <AlertDescription>
            Defina <code className="text-xs bg-muted px-1 rounded">VITE_ADMIN_KEY</code> no{" "}
            <code className="text-xs bg-muted px-1 rounded">.env</code> (mesmo valor que a API espera em{" "}
            <code className="text-xs bg-muted px-1 rounded">X-Admin-Key</code>) e reinicie o Vite.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const active = statusQuery.data?.active;

  return (
    <AppLayout title="Admin" subtitle="Configurações do sistema">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> API Key Cloudia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Status:</span>
            {statusQuery.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Badge
                variant="outline"
                className={
                  active
                    ? "bg-success/15 text-success border-success/20"
                    : "bg-muted text-muted-foreground"
                }
              >
                {active ? "Ativa" : "Inativa / não configurada"}
              </Badge>
            )}
          </div>
          {statusQuery.isError && (
            <p className="text-sm text-destructive mb-4">
              {(statusQuery.error as Error)?.message}
            </p>
          )}
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input
              type="password"
              placeholder="Nova API Key..."
              className="flex-1"
              value={novaKey}
              onChange={(e) => setNovaKey(e.target.value)}
            />
            <Button
              className="gap-1.5 shrink-0"
              disabled={!novaKey.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(novaKey.trim())}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5 text-destructive hover:text-destructive"
            disabled={deleteMutation.isPending || !active}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Revogar chave atual
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
