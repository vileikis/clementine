"use client";

/**
 * useViewport hook
 *
 * Manages viewport mode state with support for both controlled and uncontrolled modes.
 * Provides computed dimensions based on current viewport mode.
 */

import { useState, useCallback, useMemo } from "react";
import type {
  ViewportMode,
  ViewportDimensions,
  UseViewportReturn,
} from "../types";
import { VIEWPORT_DIMENSIONS } from "../constants";

interface UseViewportOptions {
  /** Initial mode for uncontrolled usage. Default: "mobile" */
  defaultMode?: ViewportMode;
  /** Controlled mode value */
  mode?: ViewportMode;
  /** Callback when mode changes (for controlled mode) */
  onModeChange?: (mode: ViewportMode) => void;
}

/**
 * Hook for managing viewport mode state.
 *
 * Supports both controlled and uncontrolled patterns:
 * - Uncontrolled: Just pass defaultMode, hook manages state internally
 * - Controlled: Pass mode and onModeChange for external state management
 *
 * @example
 * // Uncontrolled
 * const { mode, setMode, toggle, dimensions } = useViewport();
 *
 * @example
 * // Controlled
 * const [viewport, setViewport] = useState<ViewportMode>("mobile");
 * const { mode, toggle, dimensions } = useViewport({
 *   mode: viewport,
 *   onModeChange: setViewport,
 * });
 */
export function useViewport(options: UseViewportOptions = {}): UseViewportReturn {
  const {
    defaultMode = "mobile",
    mode: controlledMode,
    onModeChange,
  } = options;

  // Internal state for uncontrolled mode
  const [internalMode, setInternalMode] = useState<ViewportMode>(defaultMode);

  // Determine if controlled
  const isControlled = controlledMode !== undefined;

  // Current mode (controlled or uncontrolled)
  const mode = isControlled ? controlledMode : internalMode;

  // Set mode handler
  const setMode = useCallback(
    (newMode: ViewportMode) => {
      if (isControlled) {
        onModeChange?.(newMode);
      } else {
        setInternalMode(newMode);
      }
    },
    [isControlled, onModeChange]
  );

  // Toggle between mobile and desktop
  const toggle = useCallback(() => {
    const newMode: ViewportMode = mode === "mobile" ? "desktop" : "mobile";
    setMode(newMode);
  }, [mode, setMode]);

  // Compute dimensions based on current mode
  const dimensions: ViewportDimensions = useMemo(
    () => VIEWPORT_DIMENSIONS[mode],
    [mode]
  );

  return {
    mode,
    setMode,
    toggle,
    dimensions,
  };
}
