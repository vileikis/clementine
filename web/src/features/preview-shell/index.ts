/**
 * preview-shell feature module
 *
 * Provides reusable device preview capabilities for any content in the application.
 * Includes device frame, viewport switching, and fullscreen mode.
 *
 * @example
 * // Basic usage
 * import { PreviewShell } from "@/features/preview-shell";
 *
 * <PreviewShell>
 *   <YourContent />
 * </PreviewShell>
 *
 * @example
 * // With all features
 * import { PreviewShell } from "@/features/preview-shell";
 * import { ThemedBackground } from "@/features/theming";
 *
 * <PreviewShell enableViewportSwitcher enableFullscreen>
 *   <ThemedBackground background={theme.background}>
 *     <YourContent />
 *   </ThemedBackground>
 * </PreviewShell>
 */

// Components
export { PreviewShell } from "./components";
export { DeviceFrame } from "./components";
export { ViewportSwitcher } from "./components";
export { FullscreenOverlay } from "./components";
export { FullscreenTrigger } from "./components";

// Hooks
export { useViewport } from "./hooks";
export { useFullscreen } from "./hooks";

// Context
export { ViewportProvider, useViewportContext } from "./context";

// Types
export type {
  ViewportMode,
  ViewportDimensions,
  ViewportContextValue,
  PreviewShellProps,
  DeviceFrameProps,
  ViewportSwitcherProps,
  FullscreenOverlayProps,
  FullscreenTriggerProps,
  UseViewportReturn,
  UseFullscreenReturn,
} from "./types";
