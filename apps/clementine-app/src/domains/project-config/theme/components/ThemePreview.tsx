/**
 * ThemePreview Component
 *
 * Display-only preview component showing how the theme will appear
 * in the guest-facing experience. Uses ThemedText, ThemedButton, and
 * ThemedBackground primitives from shared theming module.
 *
 * Must be used within a ThemeProvider.
 */

import {
  ThemedBackground,
  ThemedButton,
  ThemedText,
  useEventTheme,
} from '@/shared/theming'

export function ThemePreview() {
  const { theme } = useEventTheme()

  return (
    <ThemedBackground className="h-full w-full">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        {/* Text samples */}
        <div className="space-y-4 w-full">
          <ThemedText variant="heading">Event Title</ThemedText>
          <ThemedText variant="body" className="opacity-90">
            Sample text preview showing how your content will appear to guests
          </ThemedText>
        </div>

        {/* Button sample */}
        <ThemedButton size="md">Sample Button</ThemedButton>

        {/* Primary color accent */}
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <ThemedText variant="small">Primary accent color</ThemedText>
        </div>
      </div>
    </ThemedBackground>
  )
}
