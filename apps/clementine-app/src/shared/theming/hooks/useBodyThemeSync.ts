import { useEffect } from 'react'

/**
 * Syncs the document body background color and meta theme-color tag
 * with the provided background color.
 *
 * This is useful for Safari mobile where the status bar and browser
 * chrome areas need to match the page background for an immersive experience.
 *
 * Cleans up on unmount by resetting body background and removing the meta tag.
 *
 * @param backgroundColor - Hex color string to apply (e.g., "#000000")
 *
 * @example
 * ```tsx
 * function GuestPage() {
 *   const theme = project.publishedConfig?.theme ?? DEFAULT_THEME
 *   useBodyThemeSync(theme.background.color)
 *
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <PageContent />
 *     </ThemeProvider>
 *   )
 * }
 * ```
 */
export function useBodyThemeSync(backgroundColor: string): void {
  useEffect(() => {
    // Guard: skip if no valid color provided
    if (!backgroundColor) return

    // Store original body background to restore on cleanup
    const originalBackground = document.body.style.backgroundColor

    // Set body background color
    document.body.style.backgroundColor = backgroundColor

    // Set or create meta theme-color for Safari status bar
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const metaWasCreated = !meta

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', backgroundColor)

    // Cleanup on unmount
    return () => {
      document.body.style.backgroundColor = originalBackground
      if (metaWasCreated && meta) {
        meta.remove()
      } else if (meta) {
        // Reset to empty if we didn't create it
        meta.setAttribute('content', '')
      }
    }
  }, [backgroundColor])
}
