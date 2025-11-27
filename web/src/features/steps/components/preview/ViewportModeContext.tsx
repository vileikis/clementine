"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ViewportMode } from "../../types/preview.types";

const ViewportModeContext = createContext<ViewportMode>("mobile");

interface ViewportModeProviderProps {
  mode: ViewportMode;
  children: ReactNode;
}

export function ViewportModeProvider({ mode, children }: ViewportModeProviderProps) {
  return (
    <ViewportModeContext.Provider value={mode}>
      {children}
    </ViewportModeContext.Provider>
  );
}

export function useViewportMode(): ViewportMode {
  return useContext(ViewportModeContext);
}
