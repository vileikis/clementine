"use client";

/**
 * PreviewShell component
 *
 * Main wrapper component that orchestrates device frame, viewport switching,
 * and optional fullscreen mode. Provides a consistent preview experience
 * across the application.
 */

import { cn } from "@/lib/utils";
import type { PreviewShellProps, ViewportMode } from "../types";
import { ViewportProvider } from "../context";
import { useViewport } from "../hooks/useViewport";
import { useFullscreen } from "../hooks/useFullscreen";
import { DeviceFrame } from "./DeviceFrame";
import { ViewportSwitcher } from "./ViewportSwitcher";
import { FullscreenOverlay } from "./FullscreenOverlay";
import { FullscreenTrigger } from "./FullscreenTrigger";

/**
 * PreviewShell renders content inside a device frame with optional
 * viewport switching and fullscreen capabilities.
 *
 * @example
 * // Basic usage
 * <PreviewShell>
 *   <YourContent />
 * </PreviewShell>
 *
 * @example
 * // With all features
 * <PreviewShell enableViewportSwitcher enableFullscreen>
 *   <ThemedBackground background={theme.background}>
 *     <YourContent />
 *   </ThemedBackground>
 * </PreviewShell>
 *
 * @example
 * // Controlled viewport
 * <PreviewShell
 *   viewportMode={viewport}
 *   onViewportChange={setViewport}
 *   enableViewportSwitcher
 * >
 *   <YourContent />
 * </PreviewShell>
 */
export function PreviewShell({
  children,
  enableViewportSwitcher = false,
  enableFullscreen = false,
  defaultViewport = "mobile",
  viewportMode: controlledViewport,
  onViewportChange,
  onFullscreenEnter,
  onFullscreenExit,
  className,
}: PreviewShellProps) {
  // Viewport state management
  const { mode, setMode } = useViewport({
    defaultMode: defaultViewport,
    mode: controlledViewport,
    onModeChange: onViewportChange,
  });

  // Fullscreen state management
  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen({
    onEnter: onFullscreenEnter,
    onExit: onFullscreenExit,
  });

  // Handler for viewport change
  const handleViewportChange = (newMode: ViewportMode) => {
    setMode(newMode);
  };

  // Handler for fullscreen exit
  const handleFullscreenExit = () => {
    exitFullscreen();
  };

  return (
    <ViewportProvider mode={mode} isFullscreen={isFullscreen}>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Controls row - only show if features are enabled */}
        {(enableViewportSwitcher || enableFullscreen) && (
          <div className="flex items-center justify-between gap-4">
            {/* Viewport switcher */}
            {enableViewportSwitcher ? (
              <ViewportSwitcher
                mode={mode}
                onChange={handleViewportChange}
                size="md"
              />
            ) : (
              <div /> // Spacer for layout
            )}

            {/* Fullscreen trigger */}
            {enableFullscreen && (
              <FullscreenTrigger onClick={enterFullscreen} size="md" />
            )}
          </div>
        )}

        {/* Device frame with content */}
        <div className="flex justify-center">
          <DeviceFrame viewportMode={mode}>{children}</DeviceFrame>
        </div>

        {/* Fullscreen overlay */}
        {enableFullscreen && isFullscreen && (
          <FullscreenOverlay
            title="Preview"
            onExit={handleFullscreenExit}
            viewportMode={mode}
            onViewportChange={enableViewportSwitcher ? handleViewportChange : undefined}
            enableViewportSwitcher={enableViewportSwitcher}
          >
            <DeviceFrame viewportMode={mode}>{children}</DeviceFrame>
          </FullscreenOverlay>
        )}
      </div>
    </ViewportProvider>
  );
}
