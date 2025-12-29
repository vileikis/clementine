'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  UseFullscreenOptions,
  UseFullscreenReturn,
} from '../types/preview-shell.types'

/**
 * Fullscreen State Hook
 *
 * Manages fullscreen overlay state with callbacks and keyboard handling
 * Handles Escape key for closing and body scroll prevention
 *
 * Note: onEnter and onExit callbacks are stored in refs to ensure
 * enter/exit/toggle functions remain stable across re-renders
 */
export function useFullscreen(
  options: UseFullscreenOptions = {},
): UseFullscreenReturn {
  const { onEnter, onExit } = options
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Store callbacks in refs to avoid recreating enter/exit functions
  const onEnterRef = useRef(onEnter)
  const onExitRef = useRef(onExit)

  // Update refs when callbacks change
  useEffect(() => {
    onEnterRef.current = onEnter
  }, [onEnter])

  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  const enter = useCallback(() => {
    setIsFullscreen(true)
    onEnterRef.current?.()
  }, [])

  const exit = useCallback(() => {
    setIsFullscreen(false)
    onExitRef.current?.()
  }, [])

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
