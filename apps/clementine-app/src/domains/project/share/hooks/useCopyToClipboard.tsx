/**
 * Clipboard copy hook with fallback support
 * Feature: 011-project-share-dialog
 */

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface UseCopyToClipboardReturn {
  /**
   * Copy text to clipboard
   */
  copyToClipboard: (text: string) => Promise<boolean>

  /**
   * Whether copy operation is in progress
   */
  isCopying: boolean

  /**
   * Whether last copy succeeded
   */
  copySuccess: boolean
}

/**
 * Hook for copying text to clipboard with modern API and fallback
 * Provides user feedback via toast notifications
 *
 * @returns Clipboard copy functions and state
 *
 * @example
 * const { copyToClipboard, isCopying, copySuccess } = useCopyToClipboard();
 * await copyToClipboard('https://example.com');
 */
export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const resetTimeoutRef = useRef<number | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  const copyToClipboard = async (text: string): Promise<boolean> => {
    setIsCopying(true)
    setCopySuccess(false)

    // Clear any existing timeout to avoid overlapping timers
    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }

    try {
      // Try modern Clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setCopySuccess(true)
        toast.success('Link copied to clipboard')
        return true
      }

      // Fallback to legacy execCommand for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const success = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (!success) {
        throw new Error('execCommand failed')
      }

      setCopySuccess(true)
      toast.success('Link copied to clipboard')
      return true
    } catch (error) {
      toast.error('Failed to copy link. Please copy manually.')
      return false
    } finally {
      setIsCopying(false)
      // Reset success state after 3 seconds
      // Store timeout ID for cleanup
      resetTimeoutRef.current = window.setTimeout(() => {
        setCopySuccess(false)
        resetTimeoutRef.current = null
      }, 3000)
    }
  }

  return {
    copyToClipboard,
    isCopying,
    copySuccess,
  }
}
