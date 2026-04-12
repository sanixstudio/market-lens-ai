import { Suspense } from "react";
import { MarketExplorer } from "@/components/markets/MarketExplorer";
import { Skeleton } from "@/components/ui/skeleton";

function ExplorerFallback() {
  return (
    <div className="mesh-page flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div className="chrome-glass shrink-0 px-4 py-3 sm:px-6">
        <Skeleton className="h-12 w-full max-w-xl rounded-xl bg-muted/50" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <Skeleton className="min-h-[220px] flex-1 rounded-xl bg-muted/40 lg:min-h-0" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<ExplorerFallback />}>
      <MarketExplorer />
    </Suspense>
  );
}
