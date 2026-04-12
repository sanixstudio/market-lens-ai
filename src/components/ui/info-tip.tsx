"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type InfoTipProps = {
  /** Accessible name for the help control (e.g. "How search works"). */
  label: string;
  /** Tooltip body; keep to a few short sentences. */
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
};

/**
 * Help icon that shows details on hover or keyboard focus (Base UI tooltip).
 *
 * @example
 * <InfoTip label="About the map">
 *   Each marker is one labor market. Color reflects opportunity score, not job count.
 * </InfoTip>
 */
export function InfoTip({
  label,
  children,
  className,
  contentClassName,
  side = "top",
  align = "center",
}: InfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        delay={180}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-[color,background-color,border-color,box-shadow] hover:border-border/50 hover:bg-muted/70 hover:text-foreground focus-visible:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          className
        )}
        aria-label={label}
      >
        <CircleHelp className="size-3.5" strokeWidth={2} aria-hidden />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className={cn(
          "max-w-[min(19rem,calc(100vw-2rem))] text-balance px-3 py-2 font-normal normal-case tracking-normal leading-relaxed",
          contentClassName
        )}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
