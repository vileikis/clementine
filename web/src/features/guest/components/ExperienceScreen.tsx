"use client"

import { Home } from "lucide-react"
import { useEventTheme, BUTTON_RADIUS_MAP } from "@/features/theming"

interface ExperienceScreenProps {
  /** Experience name to display */
  experienceName: string
  /** Guest ID for debugging */
  guestId?: string
  /** Session ID for debugging */
  sessionId: string
  /** Callback when home button is clicked */
  onHomeClick: () => void
}

/**
 * Placeholder experience screen component.
 * Shows experience name, guest ID, session ID, and home button.
 *
 * This is a placeholder for MVP - the full experience engine
 * will replace this in a future phase.
 */
export function ExperienceScreen({
  experienceName,
  guestId,
  sessionId,
  onHomeClick,
}: ExperienceScreenProps) {
  const { theme } = useEventTheme()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-6">
      {/* Experience name */}
      <h1
        className="text-2xl font-bold text-center"
        style={{ color: theme.text.color }}
      >
        {experienceName}
      </h1>

      {/* Session info (for debugging) */}
      <div
        className="text-center space-y-1 text-sm opacity-60"
        style={{ color: theme.text.color }}
      >
        {guestId && <p>Guest: {guestId.slice(0, 8)}...</p>}
        <p>Session: {sessionId.slice(0, 8)}...</p>
      </div>

      {/* Placeholder message */}
      <p
        className="text-center opacity-80"
        style={{ color: theme.text.color }}
      >
        Experience coming soon...
      </p>

      {/* Home button */}
      <button
        onClick={onHomeClick}
        className="flex items-center gap-2 px-6 py-3 font-medium transition-transform active:scale-[0.98] min-h-[44px] min-w-[44px]"
        style={{
          backgroundColor: theme.button.backgroundColor || theme.primaryColor,
          color: theme.button.textColor,
          borderRadius: BUTTON_RADIUS_MAP[theme.button.radius],
        }}
      >
        <Home className="h-5 w-5" />
        <span>Back to Home</span>
      </button>
    </div>
  )
}
