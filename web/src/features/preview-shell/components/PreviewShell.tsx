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
import { useFullscreen } from "../hooks/useFullscreen";
import { useViewportStore } from "../store";
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
  viewportMode: controlledViewport,
  onViewportChange,
  onFullscreenEnter,
  onFullscreenExit,
  className,
}: PreviewShellProps) {
  // Global viewport store (used when not controlled)
  const globalMode = useViewportStore((state) => state.mode);
  const setGlobalMode = useViewportStore((state) => state.setMode);

  // Determine if controlled mode
  const isControlled = controlledViewport !== undefined;

  // Use controlled or global mode
  const mode = isControlled ? controlledViewport : globalMode;

  // Fullscreen state management
  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen({
    onEnter: onFullscreenEnter,
    onExit: onFullscreenExit,
  });

  // Handler for viewport change - updates both controlled callback and global store
  const handleViewportChange = (newMode: ViewportMode) => {
    if (isControlled) {
      onViewportChange?.(newMode);
    }
    // Always update global store so all PreviewShells stay in sync
    setGlobalMode(newMode);
  };

  // Handler for fullscreen exit
  const handleFullscreenExit = () => {
    exitFullscreen();
  };

  const isMobile = mode === "mobile";

  return (
    <ViewportProvider mode={mode} isFullscreen={isFullscreen}>
      <div className={cn("flex flex-col gap-4 h-full", className)}>
        {/* Controls row - only show if features are enabled */}
        {(enableViewportSwitcher || enableFullscreen) && (
          <div className="flex items-center justify-between gap-4 shrink-0">
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
        <div
          className={cn(
            "flex min-h-0",
            // Mobile: center the fixed-size frame
            isMobile && "justify-center",
            // Desktop: fill available space with flex column for proper height
            !isMobile && "flex-1 flex-col"
          )}
        >
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
