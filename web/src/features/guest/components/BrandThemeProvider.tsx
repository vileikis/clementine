"use client"

import { useEffect } from "react"

interface BrandThemeProviderProps {
  brandColor: string
  children: React.ReactNode
}

/**
 * Injects brand color as CSS variable for use throughout guest flow
 * Updates --brand CSS variable when brandColor prop changes
 */
export function BrandThemeProvider({
  brandColor,
  children,
}: BrandThemeProviderProps) {
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", brandColor)
  }, [brandColor])

  return <>{children}</>
}
