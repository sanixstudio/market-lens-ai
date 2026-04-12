"use client";

import { Link2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  /** Pathname + query only (e.g. `/?specialty=…`). Origin is added on copy in the browser. */
  sharePath: string;
};

/**
 * Copies the current explore deep link (filters + optional region + tab) to the clipboard.
 */
export function ShareViewButton({ sharePath }: Props) {
  const onCopy = useCallback(async () => {
    if (!sharePath) return;
    try {
      const absolute = `${window.location.origin}${sharePath.startsWith("/") ? sharePath : `/${sharePath}`}`;
      await navigator.clipboard.writeText(absolute);
      toast.success("Link copied", { description: "Share this view with the same filters and region." });
    } catch {
      toast.error("Couldn’t copy", { description: "Allow clipboard access or copy the URL from the address bar." });
    }
  }, [sharePath]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 gap-1.5 border-border/60 px-3 text-xs font-medium shadow-sm sm:h-10 sm:text-sm"
      disabled={!sharePath}
      onClick={() => void onCopy()}
    >
      <Link2 className="size-3.5 sm:size-4" aria-hidden />
      Copy link
    </Button>
  );
}
