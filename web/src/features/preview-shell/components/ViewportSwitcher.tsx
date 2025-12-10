"use client";

/**
 * ViewportSwitcher component
 *
 * A toggle component for switching between mobile and desktop viewport modes.
 * Provides accessible buttons with icons and labels.
 */

import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewportSwitcherProps } from "../types";

/**
 * Renders mobile/desktop toggle buttons for viewport switching.
 *
 * @example
 * <ViewportSwitcher
 *   mode={viewport}
 *   onChange={setViewport}
 *   size="md"
 * />
 */
export function ViewportSwitcher({
  mode,
  onChange,
  className,
  size = "md",
}: ViewportSwitcherProps) {
  // Size-based styling
  const buttonSize = size === "sm" ? "px-2 py-1.5" : "px-3 py-2";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-muted rounded-lg",
        className
      )}
      role="group"
      aria-label="Viewport size"
    >
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={cn(
          "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
          // Touch target minimum 44x44px
          "min-w-11 min-h-11",
          buttonSize,
          mode === "mobile"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "mobile"}
        aria-label="Mobile preview"
      >
        <Smartphone className={iconSize} />
        <span className="hidden sm:inline">Mobile</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={cn(
          "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
          // Touch target minimum 44x44px
          "min-w-11 min-h-11",
          buttonSize,
          mode === "desktop"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={mode === "desktop"}
        aria-label="Desktop preview"
      >
        <Monitor className={iconSize} />
        <span className="hidden sm:inline">Desktop</span>
      </button>
    </div>
  );
}
