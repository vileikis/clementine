'use client'

import { createContext, useContext, useMemo } from 'react'
import { VIEWPORT_DIMENSIONS } from '../constants/viewport.constants'
import type {
  ViewportContextValue,
  ViewportMode,
} from '../types/preview-shell.types'

const ViewportContext = createContext<ViewportContextValue | null>(null)

interface ViewportProviderProps {
  mode: ViewportMode
  children: React.ReactNode
}

/**
 * Viewport Context Provider
 *
 * Provides viewport state to nested components via React Context
 * Computes dimensions from mode using VIEWPORT_DIMENSIONS lookup
 */
export function ViewportProvider({ mode, children }: ViewportProviderProps) {
  const value = useMemo(
    () => ({
      mode,
      dimensions: VIEWPORT_DIMENSIONS[mode],
    }),
    [mode],
  )

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  )
}

/**
 * Viewport Context Hook
 *
 * @throws Error if used outside ViewportProvider
 */
export function useViewportContext(): ViewportContextValue {
  const context = useContext(ViewportContext)
  if (!context) {
    throw new Error('useViewportContext must be used within ViewportProvider')
  }
  return context
}
