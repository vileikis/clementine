/**
 * ThemePreview Component
 *
 * Display-only preview component showing how the theme will appear
 * in the guest-facing experience. Uses ThemedText, ThemedButton, and
 * ThemedBackground primitives from shared theming module.
 */

import type { Theme } from '@/shared/theming/schemas/theme.schemas'
import { ThemedBackground, ThemedButton, ThemedText } from '@/shared/theming'

export interface ThemePreviewProps {
  /** Theme to preview */
  theme: Theme
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="h-full w-full"
      contentClassName="flex flex-col items-center justify-center gap-8 p-8"
    >
      {/* Text samples */}
      <div className="space-y-4 w-full">
        <ThemedText variant="heading" theme={theme}>
          Event Title
        </ThemedText>
        <ThemedText variant="body" theme={theme} className="opacity-90">
          Sample text preview showing how your content will appear to guests
        </ThemedText>
      </div>

      {/* Button sample */}
      <ThemedButton theme={theme} size="md">
        Sample Button
      </ThemedButton>

      {/* Primary color accent */}
      <div className="flex items-center gap-2">
        <div
          className="size-4 rounded-full"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <ThemedText variant="small" theme={theme}>
          Primary accent color
        </ThemedText>
      </div>
    </ThemedBackground>
  )
}
