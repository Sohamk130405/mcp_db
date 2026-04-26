"use client";
import React from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Copy,
  Check,
  Database,
  Zap,
  Activity,
  Key,
  TrendingUp,
  MessageSquare,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { cn, DB_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui";

// ── Icon Map (for rendering icons from string identifiers) ────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  activity: Activity,
  key: Key,
  trendingUp: TrendingUp,
  database: Database,
  messageSquare: MessageSquare,
  download: Download,
  checkCircle2: CheckCircle2,
  xCircle: XCircle,
  clock: Clock,
  zap: Zap,
  copy: Copy,
  check: Check,
  moon: Moon,
  sun: Sun,
};

export function renderIcon(iconName: string, className?: string) {
  const Icon = ICON_MAP[iconName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90" />
        <Zap className="absolute inset-0 m-auto w-4 h-4 text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight">
        DB<span className="gradient-text-sm">Talk</span>
      </span>
    </div>
  );
}

// ── ThemeToggle ───────────────────────────────────────────────────────────────
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-xl"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────────
export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      className={cn("h-7 w-7 rounded-lg", className)}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

// ── GradientText ──────────────────────────────────────────────────────────────
export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── GlowCard ──────────────────────────────────────────────────────────────────
export function GlowCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-6",
        "transition-all duration-300 hover:-translate-y-1",
        "hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      {children}
    </div>
  );
}

// ── DatabaseIcon ──────────────────────────────────────────────────────────────
export function DatabaseIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const colors: Record<string, string> = {
    mongodb: "text-green-400",
    postgresql: "text-blue-400",
    mysql: "text-orange-400",
  };
  return (
    <Database
      className={cn(
        "w-5 h-5",
        colors[type] ?? "text-muted-foreground",
        className,
      )}
    />
  );
}

// ── DbTypeBadge ───────────────────────────────────────────────────────────────
export function DbTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    mongodb: "bg-green-500/10 text-green-400 border-green-500/20",
    postgresql: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    mysql: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        styles[type] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {DB_LABELS[type] ?? type}
    </span>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon = Database,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}

// ── LoadingSpinner ─────────────────────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin",
        className,
      )}
    />
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = "indigo",
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
  trendLabel?: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const Icon = ICON_MAP[icon];
  const colors = {
    indigo:
      "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
    emerald:
      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    amber:
      "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4 card-hover">
      <div
        className={cn(
          "w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0",
          colors[color],
        )}
      >
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {trend !== undefined && (
          <p
            className={cn(
              "text-xs mt-1",
              trend >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
}
