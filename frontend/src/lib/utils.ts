import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export const DB_COLORS: Record<string, string> = {
  mongodb: "text-green-400 bg-green-400/10 border-green-400/20",
  postgresql: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  mysql: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

export const DB_PORTS: Record<string, number> = {
  mongodb: 27017,
  postgresql: 5432,
  mysql: 3306,
};

export const DB_LABELS: Record<string, string> = {
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
};
