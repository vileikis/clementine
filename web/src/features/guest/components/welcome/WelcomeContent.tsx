"use client"

import { useMemo } from "react"
import { useEventTheme } from "@/features/theming"
import type { Experience } from "@/features/experiences"
import type { EventWelcome, Event } from "@/features/events/types/event.types"
import { ExperienceCards } from "./ExperienceCards"

interface WelcomeContentProps {
  /** Welcome configuration from event */
  welcome: EventWelcome
  /** Event data for experiences list */
  event: Event
  /** Experience details by ID */
  experiencesMap: Record<string, Experience>
  /** Optional click handler for experience selection - undefined for preview mode */
  onExperienceClick?: (experienceId: string) => void
}

/**
 * Welcome screen content component.
 * Displays hero media, title, description, and experience cards.
 *
 * This component is the single source of truth for welcome screen UI.
 * Used by both guest flow (with onExperienceClick) and admin preview (without).
 */
export function WelcomeContent({
  welcome,
  event,
  experiencesMap,
  onExperienceClick,
}: WelcomeContentProps) {
  const { theme } = useEventTheme()

  // Filter to show only enabled experiences
  const enabledExperiences = useMemo(
    () => event.experiences.filter((exp) => exp.enabled),
    [event.experiences]
  )

  // Get the display title (fall back to event name)
  const displayTitle = welcome.title?.trim() || event.name

  return (
    <div className="flex flex-col">
      {/* Hero media (image or video) */}
      {welcome.mediaUrl && (
        <div className="relative w-full aspect-video shrink-0 overflow-hidden">
          {welcome.mediaType === "video" ? (
            <video
              src={welcome.mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={welcome.mediaUrl}
              alt="Welcome hero"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-col gap-4 p-4">
        {/* Title */}
        <h1
          className="text-2xl font-bold"
          style={{
            color: theme.text.color,
            textAlign: theme.text.alignment,
          }}
        >
          {displayTitle}
        </h1>

        {/* Description */}
        {welcome.description && (
          <p
            className="text-base"
            style={{
              color: theme.text.color,
              textAlign: theme.text.alignment,
              opacity: 0.9,
            }}
          >
            {welcome.description}
          </p>
        )}

        {/* Experience cards */}
        <div className="mt-2">
          <ExperienceCards
            experiences={enabledExperiences}
            layout={welcome.layout ?? "list"}
            experiencesMap={experiencesMap}
            onExperienceClick={onExperienceClick}
          />
        </div>
      </div>
    </div>
  )
}
