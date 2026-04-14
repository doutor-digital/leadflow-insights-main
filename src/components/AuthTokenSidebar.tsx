import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBearerToken } from "@/hooks/useBearerToken";
import { cn } from "@/lib/utils";

interface AuthTokenSidebarProps {
  collapsed: boolean;
}

export function AuthTokenSidebar({ collapsed }: AuthTokenSidebarProps) {
  const queryClient = useQueryClient();
  const { token, save, clear, hasToken } = useBearerToken();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  const refreshData = () => {
    queryClient.invalidateQueries();
  };

  const handleSave = () => {
    save(draft || token || "");
    setDraft("");
    refreshData();
    setOpen(false);
  };

  const handleClear = () => {
    clear();
    setDraft("");
    refreshData();
    setOpen(false);
  };

  const form = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="bearer-token" className="text-xs text-sidebar-foreground">
          Bearer token
        </Label>
        <Input
          id="bearer-token"
          type="password"
          autoComplete="off"
          placeholder="Cole o JWT ou o valor do token"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-9 text-xs bg-sidebar-accent/50 border-sidebar-border"
        />
        <p className="text-[10px] text-sidebar-muted leading-snug">
          Guardado só neste browser (localStorage). Enviado como{" "}
          <code className="text-[10px]">Authorization: Bearer …</code>
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1 h-8 text-xs" onClick={handleSave}>
          <Check className="h-3.5 w-3.5 mr-1" />
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleClear}
          disabled={!hasToken}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  if (collapsed) {
    return (
      <div className="px-2 pb-2 flex justify-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border border-sidebar-border transition-colors",
                hasToken
                  ? "bg-sidebar-primary/15 text-sidebar-primary border-sidebar-primary/30"
                  : "bg-sidebar-accent/30 text-sidebar-muted hover:text-sidebar-foreground"
              )}
              title="Token API (Bearer)"
            >
              <KeyRound className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-80">
            <p className="text-sm font-medium mb-2">Autenticação API</p>
            {form}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="px-2 pb-3 border-b border-sidebar-border mb-1">
      <div className="rounded-md border border-sidebar-border bg-sidebar-accent/20 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <KeyRound className="h-4 w-4 shrink-0 text-sidebar-primary" />
          <span className="text-xs font-medium">Token API</span>
          {hasToken && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-success/20 text-success border border-success/30">
              ativo
            </span>
          )}
        </div>
        {form}
      </div>
    </div>
  );
}
