"use client"

import { cn } from "@/lib/utils"
import type { Experience } from "@/features/experiences"
import type { EventExperienceLink, ExperienceLayout } from "@/features/events/types/event.types"
import { ExperienceCard } from "./ExperienceCard"

interface ExperienceCardsProps {
  /** List of enabled experiences to display */
  experiences: EventExperienceLink[]
  /** Layout mode: list (single column) or grid (two columns) */
  layout: ExperienceLayout
  /** Map of experience details for name and media */
  experiencesMap?: Map<string, Experience>
  /** Optional click handler for experience selection */
  onExperienceClick?: (experienceId: string) => void
}

/**
 * Renders experience cards in either list or grid layout.
 * Cards use subtle styling without theme button colors.
 *
 * When onExperienceClick is provided, cards become interactive buttons.
 * When onExperienceClick is undefined (admin preview), cards are non-interactive.
 */
export function ExperienceCards({
  experiences,
  layout,
  experiencesMap,
  onExperienceClick,
}: ExperienceCardsProps) {
  if (experiences.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-center text-sm opacity-60">
        <p>No experiences added yet</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "gap-3 mx-auto",
        layout === "list" ? "flex flex-col max-w-sm" : "grid grid-cols-2 max-w-md"
      )}
    >
      {experiences.map((experienceLink) => {
        const experience = experiencesMap?.get(experienceLink.experienceId)
        return (
          <ExperienceCard
            key={experienceLink.experienceId}
            experienceLink={experienceLink}
            experience={experience}
            layout={layout}
            onClick={
              onExperienceClick
                ? () => onExperienceClick(experienceLink.experienceId)
                : undefined
            }
          />
        )
      })}
    </div>
  )
}
