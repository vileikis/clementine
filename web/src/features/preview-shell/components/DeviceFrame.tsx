"use client";

/**
 * DeviceFrame component
 *
 * A pure container that simulates a device screen with proper dimensions.
 * Does NOT handle theming - consumers wrap content with ThemedBackground as needed.
 *
 * Supports mobile (375x667px) and desktop (900x600px) viewport modes.
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
        className
      )}
      style={{
        // Width: use dimension but don't exceed available space
        width: isMobile ? dimensions.width : "100%",
        maxWidth: dimensions.width,
        // Height: fixed for both modes to ensure background fills space
        height: dimensions.height,
      }}
    >
      {/* Content container */}
      <div className="relative h-full w-full overflow-auto">{children}</div>
    </div>
  );
}
