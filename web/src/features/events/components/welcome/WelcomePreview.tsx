"use client"

import { PreviewShell } from "@/features/preview-shell"
import { ThemeProvider, ThemedBackground, useEventTheme } from "@/features/theming"
import type { Experience } from "@/features/experiences"
import { WelcomeContent } from "@/features/guest/components/welcome"
import type { EventWelcome, Event } from "../../types/event.types"

interface WelcomePreviewProps {
  /** Welcome form values from React Hook Form watch() */
  welcome: EventWelcome
  /** Event data for theme and experiences */
  event: Event
  /** Pre-fetched experience details map */
  experiencesMap: Map<string, Experience>
}

/**
 * Live preview component for the welcome screen.
 * Renders inside a device frame with event theme applied.
 *
 * This is a thin wrapper around WelcomeContent from the guest module.
 * The guest module owns the UI components; admin preview imports from there.
 *
 * Receives welcome values from parent (EventGeneralTab) via form.watch()
 * to enable real-time preview updates as user types.
 */
export function WelcomePreview({
  welcome,
  event,
  experiencesMap,
}: WelcomePreviewProps) {
  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <ThemeProvider theme={event.theme}>
        <PreviewContent
          welcome={welcome}
          event={event}
          experiencesMap={experiencesMap}
        />
      </ThemeProvider>
    </PreviewShell>
  )
}

/**
 * Inner content component that uses theme context for background
 */
function PreviewContent({
  welcome,
  event,
  experiencesMap,
}: {
  welcome: EventWelcome
  event: Event
  experiencesMap: Map<string, Experience>
}) {
  const { theme } = useEventTheme()

  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="flex h-full flex-col"
    >
      <WelcomeContent
        welcome={welcome}
        event={event}
        experiencesMap={experiencesMap}
      />   
    </ThemedBackground>
  )
}
