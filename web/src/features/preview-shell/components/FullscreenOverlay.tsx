"use client";

/**
 * FullscreenOverlay component
 *
 * CSS-based fullscreen overlay with header, close button, and optional viewport switcher.
 * Supports Escape key to close (enabled by default).
 */

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FullscreenOverlayProps } from "../types";
import { ViewportSwitcher } from "./ViewportSwitcher";

/**
 * Renders a fullscreen overlay with centered content.
 * Handles Escape key press for keyboard accessibility.
 *
 * @example
 * <FullscreenOverlay
 *   title="Preview"
 *   onExit={handleExit}
 *   enableViewportSwitcher
 *   viewportMode={mode}
 *   onViewportChange={setMode}
 * >
 *   <DeviceFrame>
 *     <Content />
 *   </DeviceFrame>
 * </FullscreenOverlay>
 */
export function FullscreenOverlay({
  children,
  title,
  headerContent,
  onExit,
  showCloseButton = true,
  closeOnEscape = true,
  viewportMode,
  enableViewportSwitcher = false,
  onViewportChange,
}: FullscreenOverlayProps) {
  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, onExit]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className={cn(
        // Full viewport overlay
        "fixed inset-0 z-50",
        // Background
        "bg-background",
        // Layout
        "flex flex-col"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Fullscreen preview"}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        {/* Left: Title and viewport switcher */}
        <div className="flex items-center gap-4">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}

          {enableViewportSwitcher && viewportMode && onViewportChange && (
            <ViewportSwitcher
              mode={viewportMode}
              onChange={onViewportChange}
              size="sm"
            />
          )}
        </div>

        {/* Center: Custom header content */}
        {headerContent && <div className="flex-1">{headerContent}</div>}

        {/* Right: Close button */}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="min-w-11 min-h-11"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </header>

      {/* Content area - centered */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}
