/**
 * useGoogleFontLoader Hook
 *
 * Loads a Google Font by injecting a <link> stylesheet into <head>.
 * Handles dedup via stable element ID and cleanup on font change/unmount.
 * No-op when fontFamily is null or fontSource is not "google".
 */

import { useEffect } from 'react'
import { buildGoogleFontsUrl } from '../lib/font-css'
import { DEFAULT_FONT_VARIANTS } from '../schemas/theme.schemas'

interface UseGoogleFontLoaderOptions {
  /** Font family name (e.g., "Inter") */
  fontFamily: string | null
  /** Font source - only loads when "google" */
  fontSource: 'google' | 'system'
  /** Weights to load (e.g., [400, 700]) */
  fontVariants?: number[]
}

function toSlug(family: string): string {
  return family.toLowerCase().replace(/\s+/g, '-')
}

export function useGoogleFontLoader({
  fontFamily,
  fontSource,
  fontVariants = DEFAULT_FONT_VARIANTS,
}: UseGoogleFontLoaderOptions): void {
  useEffect(() => {
    if (!fontFamily || fontSource !== 'google') return

    const id = `gfont-${toSlug(fontFamily)}`
    const existing = document.getElementById(id)

    const url = buildGoogleFontsUrl(fontFamily, fontVariants)

    // If the exact link already exists with the same href, skip
    if (existing && (existing as HTMLLinkElement).href === url) return

    // Remove stale link if href changed
    if (existing) existing.remove()

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)

    return () => {
      const el = document.getElementById(id)
      if (el) el.remove()
    }
  }, [fontFamily, fontSource, fontVariants])
}
