"use client";

/**
 * useFullscreen hook
 *
 * Manages fullscreen overlay state with optional callbacks.
 * Uses CSS overlay approach (not native Fullscreen API) for consistent behavior.
 */

import { useState, useCallback } from "react";
import type { UseFullscreenReturn } from "../types";

interface UseFullscreenOptions {
  /** Callback when entering fullscreen */
  onEnter?: () => void;
  /** Callback when exiting fullscreen */
  onExit?: () => void;
}

/**
 * Hook for managing fullscreen state.
 *
 * @example
 * const { isFullscreen, enter, exit, toggle } = useFullscreen({
 *   onEnter: () => console.log('Entered fullscreen'),
 *   onExit: () => console.log('Exited fullscreen'),
 * });
 */
export function useFullscreen(options: UseFullscreenOptions = {}): UseFullscreenReturn {
  const { onEnter, onExit } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);

  const enter = useCallback(() => {
    setIsFullscreen(true);
    onEnter?.();
  }, [onEnter]);

  const exit = useCallback(() => {
    setIsFullscreen(false);
    onExit?.();
  }, [onExit]);

  const toggle = useCallback(() => {
    if (isFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [isFullscreen, enter, exit]);

  return {
    isFullscreen,
    enter,
    exit,
    toggle,
  };
}
