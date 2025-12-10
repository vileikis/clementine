"use client";

/**
 * ViewportContext
 *
 * React context for sharing viewport state with nested components.
 * Provides current viewport mode, computed dimensions, and fullscreen state.
 */

import { createContext, useContext, type ReactNode } from "react";
import type {
  ViewportMode,
  ViewportDimensions,
  ViewportContextValue,
} from "../types";
import { VIEWPORT_DIMENSIONS } from "../constants";

// Default context value
const defaultContextValue: ViewportContextValue = {
  mode: "mobile",
  dimensions: VIEWPORT_DIMENSIONS.mobile,
  isFullscreen: false,
};

const ViewportContext = createContext<ViewportContextValue>(defaultContextValue);

interface ViewportProviderProps {
  /** Current viewport mode */
  mode: ViewportMode;
  /** Whether fullscreen is active */
  isFullscreen?: boolean;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component for viewport context.
 * Computes dimensions based on current mode.
 */
export function ViewportProvider({
  mode,
  isFullscreen = false,
  children,
}: ViewportProviderProps) {
  const dimensions: ViewportDimensions = VIEWPORT_DIMENSIONS[mode];

  const value: ViewportContextValue = {
    mode,
    dimensions,
    isFullscreen,
  };

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
}

/**
 * Hook to access viewport context.
 * Must be used within a ViewportProvider.
 *
 * @throws Error if used outside ViewportProvider
 */
export function useViewportContext(): ViewportContextValue {
  const context = useContext(ViewportContext);

  if (context === undefined) {
    throw new Error("useViewportContext must be used within a ViewportProvider");
  }

  return context;
}
