import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ListOrdered,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuthTokenSidebar } from "@/components/AuthTokenSidebar";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/leads", label: "Leads", icon: Users },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/operations", label: "Operações", icon: ListOrdered },
  { path: "/reports", label: "Relatórios", icon: FileText },
  { path: "/admin", label: "Admin", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <Activity className="h-6 w-6 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <span className="font-semibold text-lg text-sidebar-primary-foreground truncate">
            Lead Analytics
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <AuthTokenSidebar collapsed={collapsed} />

      {/* AI Module - Em Breve */}
      <div className="px-2 pb-3">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-md bg-sidebar-accent/30 border border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
          <Bot className="h-5 w-5 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-sidebar-foreground">IA Assistant</span>
                <Badge className="bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30 text-[10px] px-1.5 py-0">
                  Em breve
                </Badge>
              </div>
              <p className="text-xs text-sidebar-muted mt-0.5 truncate">
                Análise inteligente de leads
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
