"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Theme switcher: Light / Dark / System. Matches the shadcn + next-themes pattern
 * (https://ui.shadcn.com/docs/dark-mode/next) with a radio group for the active choice.
 * Delays rendering until mount per next-themes hydration guidance.
 */
export function ModeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, forcedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="size-9 shrink-0 rounded-lg border border-border/50 bg-muted/20 sm:size-10"
        aria-hidden
      />
    );
  }

  if (forcedTheme) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative h-9 w-9 shrink-0 border-border/60 shadow-sm sm:h-10 sm:w-10"
        )}
        aria-label="Theme"
      >
        <Sun className="size-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium">Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme ?? "system"}
            onValueChange={(value) => {
              setTheme(value);
            }}
          >
            <DropdownMenuRadioItem value="light" className="gap-2">
              <Sun className="size-4 text-muted-foreground" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="gap-2">
              <Moon className="size-4 text-muted-foreground" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="gap-2">
              <Monitor className="size-4 text-muted-foreground" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
