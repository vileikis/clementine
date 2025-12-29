'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  UseFullscreenOptions,
  UseFullscreenReturn,
} from '../types/preview-shell.types'

/**
 * Fullscreen State Hook
 *
 * Manages fullscreen overlay state with callbacks and keyboard handling
 * Handles Escape key for closing and body scroll prevention
 */
export function useFullscreen(
  options: UseFullscreenOptions = {},
): UseFullscreenReturn {
  const { onEnter, onExit } = options
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enter = useCallback(() => {
    setIsFullscreen(true)
    onEnter?.()
  }, [onEnter])

  const exit = useCallback(() => {
    setIsFullscreen(false)
    onExit?.()
  }, [onExit])

  const toggle = useCallback(() => {
    if (isFullscreen) {
      exit()
    } else {
      enter()
    }
  }, [isFullscreen, enter, exit])

  // Handle Escape key
  useEffect(() => {
    if (!isFullscreen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exit()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, exit])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  return {
    isFullscreen,
    enter,
    exit,
    toggle,
  }
}
