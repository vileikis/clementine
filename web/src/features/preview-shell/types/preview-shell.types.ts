/**
 * Types for preview-shell feature module
 *
 * Provides types for viewport management, device preview, and fullscreen mode.
 */

import type { ReactNode } from "react";

// =============================================================================
// Core Types
// =============================================================================

/**
 * Supported viewport modes for device preview
 */
export type ViewportMode = "mobile" | "desktop";

/**
 * Pixel dimensions for a viewport mode
 */
export interface ViewportDimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Context value for viewport state
 */
export interface ViewportContextValue {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Computed dimensions for current mode */
  dimensions: ViewportDimensions;
  /** Whether fullscreen overlay is active */
  isFullscreen: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for PreviewShell component
 */
export interface PreviewShellProps {
  /** Content to render inside device frame */
  children: ReactNode;

  // Feature flags
  /** Show viewport switcher controls. Default: false */
  enableViewportSwitcher?: boolean;
  /** Enable fullscreen mode. Default: false */
  enableFullscreen?: boolean;

  // Viewport control (uncontrolled)
  /** Initial viewport mode when uncontrolled. Default: "mobile" */
  defaultViewport?: ViewportMode;

  // Viewport control (controlled)
  /** Current viewport mode (controlled) */
  viewportMode?: ViewportMode;
  /** Callback when viewport changes (controlled) */
  onViewportChange?: (mode: ViewportMode) => void;

  // Fullscreen callbacks
  /** Called when entering fullscreen */
  onFullscreenEnter?: () => void;
  /** Called when exiting fullscreen */
  onFullscreenExit?: () => void;

  // Styling
  /** Additional CSS classes for container */
  className?: string;
}

/**
 * Props for DeviceFrame component
 */
export interface DeviceFrameProps {
  /** Content to render inside device frame */
  children: ReactNode;
  /** Viewport mode determining dimensions. Default: "mobile" */
  viewportMode?: ViewportMode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for ViewportSwitcher component
 */
export interface ViewportSwitcherProps {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Callback when mode changes */
  onChange: (mode: ViewportMode) => void;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant. Default: "md" */
  size?: "sm" | "md";
}

/**
 * Props for FullscreenOverlay component
 */
export interface FullscreenOverlayProps {
  /** Content to render in fullscreen */
  children: ReactNode;

  // Header content
  /** Title displayed in header */
  title?: string;
  /** Custom header content (e.g., additional controls) */
  headerContent?: ReactNode;

  // Exit options
  /** Callback when exiting fullscreen */
  onExit: () => void;
  /** Show close (X) button. Default: true */
  showCloseButton?: boolean;
  /** Exit on Escape key press. Default: true */
  closeOnEscape?: boolean;

  // Viewport support
  /** Current viewport mode */
  viewportMode?: ViewportMode;
  /** Show viewport switcher in header. Default: false */
  enableViewportSwitcher?: boolean;
  /** Callback when viewport changes */
  onViewportChange?: (mode: ViewportMode) => void;
}

/**
 * Props for FullscreenTrigger component
 */
export interface FullscreenTriggerProps {
  /** Callback when clicked */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Button size variant. Default: "md" */
  size?: "sm" | "md";
  /** Button style variant. Default: "ghost" */
  variant?: "ghost" | "outline";
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return value from useViewport hook
 */
export interface UseViewportReturn {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Set viewport mode */
  setMode: (mode: ViewportMode) => void;
  /** Toggle between mobile and desktop */
  toggle: () => void;
  /** Computed dimensions for current mode */
  dimensions: ViewportDimensions;
}

/**
 * Return value from useFullscreen hook
 */
export interface UseFullscreenReturn {
  /** Whether fullscreen is active */
  isFullscreen: boolean;
  /** Enter fullscreen mode */
  enter: () => void;
  /** Exit fullscreen mode */
  exit: () => void;
  /** Toggle fullscreen state */
  toggle: () => void;
}
