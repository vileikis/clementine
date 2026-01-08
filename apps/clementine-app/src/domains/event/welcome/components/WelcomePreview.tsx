/**
 * WelcomePreview Component
 *
 * Display-only preview component showing how the welcome screen will appear
 * in the guest-facing experience. Uses ThemedText and ThemedBackground
 * primitives from shared theming module.
 */

import type { Theme } from '@/shared/theming'
import type { WelcomeConfig } from '@/domains/event/shared'
import { ThemedBackground, ThemedText } from '@/shared/theming'

export interface WelcomePreviewProps {
  /** Welcome config to preview */
  welcome: WelcomeConfig
  /** Theme to apply to preview */
  theme: Theme
}

export function WelcomePreview({ welcome, theme }: WelcomePreviewProps) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="h-full w-full"
      contentClassName="flex flex-col items-center gap-6 p-8"
    >
      {/* Hero media */}
      {welcome.media?.url && (
        <div className="w-full max-w-md">
          <img
            src={welcome.media.url}
            alt="Welcome hero"
            className="w-full max-h-48 object-contain rounded-lg"
          />
        </div>
      )}

      {/* Title */}
      <ThemedText variant="heading" theme={theme} className="text-center">
        {welcome.title}
      </ThemedText>

      {/* Description */}
      {welcome.description && (
        <ThemedText
          variant="body"
          theme={theme}
          className="text-center opacity-90"
        >
          {welcome.description}
        </ThemedText>
      )}

      {/* Experiences placeholder */}
      <div className="mt-4 w-full max-w-md">
        <div
          className="rounded-lg border-2 border-dashed border-current/20 p-6 text-center"
          style={{ color: theme.text.color }}
        >
          <ThemedText variant="small" theme={theme} className="opacity-60">
            Experiences will appear here
          </ThemedText>
        </div>
      </div>
    </ThemedBackground>
  )
}
