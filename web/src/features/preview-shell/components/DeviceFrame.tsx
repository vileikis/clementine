"use client";

/**
 * DeviceFrame component
 *
 * A pure container that simulates a device screen with proper dimensions.
 * Does NOT handle theming - consumers wrap content with ThemedBackground as needed.
 *
 * Supports mobile (375x667px fixed) and desktop (fills available space) viewport modes.
 */

import { cn } from "@/lib/utils";
import type { DeviceFrameProps } from "../types";
import { VIEWPORT_DIMENSIONS } from "../constants";

/**
 * Renders a device frame container.
 * Content should be wrapped with ThemedBackground by the consumer for theming.
 *
 * @example
 * <DeviceFrame viewportMode="mobile">
 *   <ThemedBackground background={theme.background}>
 *     <YourContent />
 *   </ThemedBackground>
 * </DeviceFrame>
 */
export function DeviceFrame({
  children,
  viewportMode = "mobile",
  className,
}: DeviceFrameProps) {
  const dimensions = VIEWPORT_DIMENSIONS[viewportMode];
  const isMobile = viewportMode === "mobile";

  return (
    <div
      className={cn(
        // Frame styling
        "rounded-2xl border-4 border-foreground/10 shadow-lg overflow-hidden",
        // Background for frame area
        "bg-background",
        // Desktop fills available space using flex-grow (not h-full which needs explicit parent height)
        !isMobile && "w-full flex-1 flex flex-col",
        className
      )}
      style={
        isMobile
          ? {
              // Mobile: fixed dimensions
              width: dimensions.width,
              height: dimensions.height,
            }
          : {
              // Desktop: minimum height for visual presence
              minHeight: dimensions.height,
            }
      }
    >
      {/* Content container - fills frame, overflow handled by children (ThemedBackground) */}
      <div
        className={cn(
          "relative w-full",
          isMobile ? "h-full" : "flex-1 flex flex-col"
        )}
      >
        {children}
      </div>
    </div>
  );
}
