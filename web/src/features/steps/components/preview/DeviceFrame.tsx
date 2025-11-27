"use client";

/**
 * Component: DeviceFrame
 *
 * A theme-aware wrapper that simulates a device screen.
 * Supports both mobile (375px) and desktop (900px) viewport modes.
 * Applies event theme (background, overlay, text color) to provide
 * an accurate preview of how steps will appear to guests.
 *
 * Used in the journey editor's middle panel.
 */

import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { ReactNode } from "react";
import { ViewportMode, VIEWPORT_DIMENSIONS } from "../../types/preview.types";

interface DeviceFrameProps {
  children: ReactNode;
  viewportMode?: ViewportMode;
}

/**
 * Renders a device frame with event theme applied.
 * All step preview components should be rendered inside this wrapper.
 */
export function DeviceFrame({
  children,
  viewportMode = "mobile",
}: DeviceFrameProps) {
  const { theme } = useEventTheme();
  const dimensions = VIEWPORT_DIMENSIONS[viewportMode];

  // Desktop uses different aspect ratio styling
  const isMobile = viewportMode === "mobile";

  return (
    <div
      className="rounded-2xl border-4 border-foreground/10 shadow-lg overflow-hidden relative"
      style={{
        // Width: use dimension but don't exceed available space
        width: isMobile ? dimensions.width : "100%",
        maxWidth: dimensions.width,
        // Height: mobile fixed, desktop fills available
        height: isMobile ? dimensions.height : "100%",
        minHeight: isMobile ? undefined : dimensions.height,
        backgroundColor: theme.background.color,
        fontFamily: theme.fontFamily || undefined,
      }}
    >
      {/* Background Image with Overlay */}
      {theme.background.image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${theme.background.image})` }}
          />
          {theme.background.overlayOpacity > 0 && (
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: theme.background.overlayOpacity }}
            />
          )}
        </>
      )}

      {/* Logo */}
      {theme.logoUrl && (
        <div className="absolute top-4 left-0 right-0 z-20 px-4">
          <div
            style={{
              textAlign: theme.text.alignment,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.logoUrl}
              alt="Event logo"
              className={`${isMobile ? "h-8" : "h-10"} w-auto object-contain inline-block`}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-5 h-full overflow-auto">{children}</div>
    </div>
  );
}
