"use client";

/**
 * Component: ViewSwitcher
 *
 * A toggle component for switching between mobile and desktop viewport modes
 * in the Journey Editor preview panel.
 */

import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewportMode } from "../../types/preview.types";

interface ViewSwitcherProps {
  mode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
  className?: string;
}

export function ViewSwitcher({ mode, onChange, className }: ViewSwitcherProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-muted rounded-lg",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "min-w-[44px] min-h-[44px]",
          mode === "mobile"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "mobile"}
        aria-label="Mobile preview"
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "min-w-[44px] min-h-[44px]",
          mode === "desktop"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "desktop"}
        aria-label="Desktop preview"
      >
        <Monitor className="h-4 w-4" />
        <span className="hidden sm:inline">Desktop</span>
      </button>
    </div>
  );
}
