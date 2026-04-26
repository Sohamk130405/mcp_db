import { Logo } from "@/components/shared";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  compact?: boolean;
  className?: string;
};

export function PageLoader({ compact = false, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4",
        compact && "min-h-[calc(100vh-3.5rem)]",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-border/40">
        <div className="route-loader-bar h-full w-1/2 rounded-r-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
      </div>

      <div className="loader-grid absolute inset-0 opacity-70" />
      <div className="relative w-full max-w-md">
        <div className="mx-auto mb-8 flex justify-center">
          <div className="page-loader-logo rounded-2xl border border-white/10 bg-card/80 p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur">
            <Logo />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 rounded-xl border border-indigo-500/20 bg-indigo-500/10">
              <div className="page-loader-ring absolute inset-2 rounded-full border-2 border-indigo-400 border-t-transparent" />
              <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-cyan-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="loading-shimmer h-3 w-32 rounded-full bg-muted" />
              <div className="loading-shimmer h-2 w-48 max-w-full rounded-full bg-muted [animation-delay:120ms]" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="loading-shimmer h-16 rounded-xl border border-border bg-muted/50" />
            <div className="grid grid-cols-3 gap-3">
              <div className="loading-shimmer h-20 rounded-xl border border-border bg-muted/50 [animation-delay:80ms]" />
              <div className="loading-shimmer h-20 rounded-xl border border-border bg-muted/50 [animation-delay:160ms]" />
              <div className="loading-shimmer h-20 rounded-xl border border-border bg-muted/50 [animation-delay:240ms]" />
            </div>
            <div className="loading-shimmer h-24 rounded-xl border border-border bg-muted/50 [animation-delay:320ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
