import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function KpiCard({ title, value, change, changeType = "neutral", icon: Icon }: KpiCardProps) {
  const changeColor = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  }[changeType];

  return (
    <Card className="glass-card border-white/60 shadow-[0_22px_65px_-32px_rgba(15,23,42,0.55)] animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        {change && (
          <p className={`text-xs mt-1 ${changeColor}`}>{change}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, className = "" }: ChartCardProps) {
  return (
    <Card
      className={cn(
        "glass-card animate-fade-in border-white/60 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.65)]",
        className
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-base tracking-tight">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
