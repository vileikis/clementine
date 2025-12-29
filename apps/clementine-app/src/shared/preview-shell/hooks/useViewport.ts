'use client'

import { useMemo } from 'react'
import { useViewportStore } from '../store/viewportStore'
import { VIEWPORT_DIMENSIONS } from '../constants/viewport.constants'
import type { UseViewportReturn } from '../types/preview-shell.types'

/**
 * Viewport State Hook
 *
 * Manages viewport mode state with global store synchronization
 * Returns current mode, setters, and computed dimensions
 */
export function useViewport(): UseViewportReturn {
  const { mode, setMode, toggle } = useViewportStore()

  const dimensions = useMemo(() => VIEWPORT_DIMENSIONS[mode], [mode])

  return {
    mode,
    setMode,
    toggle,
    dimensions,
  }
}
