"use client";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/connections": "Connections",
  "/dashboard/api-keys": "API Keys",
  "/dashboard/chat": "AI Chat",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export function TopBar({ user }: { user: { firstName: string; imageUrl: string; plan: string } }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        <div>
          <h1 className="text-sm font-semibold">{title}</h1>
          {title === "Overview" && (
            <p className="text-xs text-muted-foreground">
              {greeting}, {user.firstName || "there"}! 👋
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-xl relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
          </Button>
          <div className="lg:hidden">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
