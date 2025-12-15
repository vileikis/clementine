"use client"

import { PreviewShell } from "@/features/preview-shell"
import { ThemeProvider, ThemedBackground, useEventTheme } from "@/features/theming"
import { OutroContent } from "@/features/guest/components/outro"
import type { EventOutro, EventShareOptions, Event } from "../../types/event.types"

interface OutroPreviewProps {
  /** Outro form values from React Hook Form watch() */
  outro: EventOutro
  /** Share options form values from React Hook Form watch() */
  shareOptions?: EventShareOptions
  /** Event data for theme */
  event: Event
}

/**
 * Live preview component for the outro screen.
 * Renders inside a device frame with event theme applied.
 *
 * This is a thin wrapper around OutroContent from the guest module.
 * The guest module owns the UI components; admin preview imports from there.
 *
 * Receives outro values from parent (outro page) via form.watch()
 * to enable real-time preview updates as user types.
 */
export function OutroPreview({
  outro,
  shareOptions,
  event,
}: OutroPreviewProps) {
  return (
    <PreviewShell enableViewportSwitcher enableFullscreen>
      <ThemeProvider theme={event.theme}>
        <PreviewContent
          outro={outro}
          shareOptions={shareOptions}
          event={event}
        />
      </ThemeProvider>
    </PreviewShell>
  )
}

/**
 * Inner content component that uses theme context for background
 */
function PreviewContent({
  outro,
  shareOptions,
  event,
}: {
  outro: EventOutro
  shareOptions?: EventShareOptions
  event: Event
}) {
  const { theme } = useEventTheme()

  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
    >
      <OutroContent
        outro={outro}
        shareOptions={shareOptions}
        event={event}
        resultImageUrl="https://placehold.co/600x800/6366F1/FFFFFF?text=AI+Result"
      />
    </ThemedBackground>
  )
}
