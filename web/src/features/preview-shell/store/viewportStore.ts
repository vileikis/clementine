"use client";

/**
 * Global viewport store
 *
 * Persists viewport mode selection across all PreviewShell instances.
 * Uses localStorage for persistence across page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewportMode } from "../types";

interface ViewportStore {
  /** Current global viewport mode */
  mode: ViewportMode;
  /** Set the viewport mode */
  setMode: (mode: ViewportMode) => void;
  /** Toggle between mobile and desktop */
  toggle: () => void;
}

/**
 * Global store for viewport mode.
 * Persists to localStorage so selection is remembered across page reloads.
 */
export const useViewportStore = create<ViewportStore>()(
  persist(
    (set) => ({
      mode: "mobile",
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((state) => ({
          mode: state.mode === "mobile" ? "desktop" : "mobile",
        })),
    }),
    {
      name: "preview-viewport",
    }
  )
);
