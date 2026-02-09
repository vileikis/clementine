import { useEffect, useRef, useState } from 'react'
import { PREVIEW_TEXT } from './constants'
import { buildGoogleFontsPreviewUrl } from '@/shared/theming/lib/font-css'

/**
 * Lazily loads a Google Font preview stylesheet when the element becomes visible.
 * Uses IntersectionObserver to defer loading until the row scrolls into view,
 * and the Google Fonts `text=` parameter to minimize download size.
 */
export function useLazyFontPreview(family: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return

        const linkId = `gfont-preview-${family.replace(/\s+/g, '-').toLowerCase()}`
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          link.href = buildGoogleFontsPreviewUrl(family, PREVIEW_TEXT)
          document.head.appendChild(link)
        }
        setFontLoaded(true)
        observer.disconnect()
      },
      { threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [family])

  return { ref, fontLoaded }
}
