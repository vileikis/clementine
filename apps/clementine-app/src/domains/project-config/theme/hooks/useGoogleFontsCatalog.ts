/**
 * useGoogleFontsCatalog Hook
 *
 * Fetches the Google Fonts catalog via the Developer API.
 * Cached aggressively — fetched once per session (staleTime: 24h).
 * Only used in the Theme Editor (admin dashboard).
 */

import { useQuery } from '@tanstack/react-query'

export interface GoogleFontEntry {
  /** Font family name (e.g., "Inter") */
  family: string
  /** Font category */
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
  /** Available variant strings from API (e.g., ["regular", "700", "700italic"]) */
  variants: string[]
  /** Numeric weights derived from variants (e.g., [400, 700]) */
  weights: number[]
}

function variantToWeight(variant: string): number | null {
  if (variant === 'regular') return 400
  if (variant === 'italic') return null
  const num = parseInt(variant, 10)
  if (!isNaN(num) && num >= 100 && num <= 900) return num
  return null
}

interface GoogleFontsApiItem {
  family: string
  category: string
  variants: string[]
}

interface GoogleFontsApiResponse {
  items: GoogleFontsApiItem[]
}

async function fetchGoogleFontsCatalog(): Promise<GoogleFontEntry[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY
  if (!apiKey) {
    throw new Error(
      'VITE_GOOGLE_FONTS_API_KEY is not set. Add it to .env.local',
    )
  }

  const res = await fetch(
    `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`,
  )

  if (!res.ok) {
    throw new Error(`Google Fonts API error: ${res.status} ${res.statusText}`)
  }

  const data: GoogleFontsApiResponse = await res.json()

  return data.items.map((item) => {
    const weights = item.variants
      .map(variantToWeight)
      .filter((w): w is number => w !== null)
      .sort((a, b) => a - b)

    return {
      family: item.family,
      category: item.category as GoogleFontEntry['category'],
      variants: item.variants,
      weights: weights.length > 0 ? weights : [400],
    }
  })
}

export function useGoogleFontsCatalog() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['google-fonts-catalog'],
    queryFn: fetchGoogleFontsCatalog,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: Infinity,
  })

  return {
    fonts: data ?? [],
    isLoading,
    error: error,
    refetch,
  }
}
