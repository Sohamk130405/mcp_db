"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Key,
  MessageSquare,
  BarChart2,
  Settings,
  Zap,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/dashboard/connections", icon: Database, label: "Connections" },
  { href: "/dashboard/api-keys", icon: Key, label: "API Keys" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
  { href: "/dashboard/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("dbtalk-sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      window.localStorage.setItem(
        "dbtalk-sidebar-collapsed",
        String(!value),
      );
      return !value;
    });
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "hidden lg:flex sticky top-0 h-screen flex-col border-r border-border bg-card/70 backdrop-blur-sm z-30 transition-[width] duration-200",
        collapsed ? "w-[4.75rem]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border p-4",
          collapsed ? "justify-center" : "justify-between gap-3",
        )}
      >
        {collapsed ? (
          <div className="relative h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <Zap className="absolute inset-0 m-auto h-4 w-4 text-white" />
          </div>
        ) : (
          <Logo />
        )}
        <button
          onClick={toggleCollapsed}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "sidebar-item group",
              collapsed && "justify-center px-2",
              isActive(item.href, item.exact)
                ? "sidebar-item-active"
                : "sidebar-item-inactive"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className={cn("flex-1 truncate", collapsed && "sr-only")}>
              {item.label}
            </span>
            {!collapsed && isActive(item.href, item.exact) && (
              <ChevronRight className="w-3 h-3 opacity-50" />
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <UserButton afterSignOutUrl="/" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                <Zap className="h-3 w-3 shrink-0" />
                <span className="truncate">Free plan</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
