"use client";

/**
 * FullscreenTrigger component
 *
 * Button to enter fullscreen preview mode.
 * Uses expand icon for clear visual affordance.
 */

import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FullscreenTriggerProps } from "../types";

/**
 * Renders a button to trigger fullscreen mode.
 *
 * @example
 * <FullscreenTrigger onClick={enterFullscreen} />
 */
export function FullscreenTrigger({
  onClick,
  className,
  size = "md",
  variant = "ghost",
}: FullscreenTriggerProps) {
  // Size-based icon styling
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={onClick}
      className={cn(
        // Touch target minimum 44x44px
        "min-w-11 min-h-11",
        className
      )}
      aria-label="Enter fullscreen preview"
    >
      <Maximize2 className={iconSize} />
    </Button>
  );
}
