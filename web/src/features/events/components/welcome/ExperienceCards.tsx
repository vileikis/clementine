"use client";

import { cn } from "@/lib/utils";
import { useEventTheme } from "@/features/theming";
import type { EventExperienceLink, ExperienceLayout } from "../../types/event.types";

interface ExperienceCardsProps {
  /** List of enabled experiences to display */
  experiences: EventExperienceLink[];
  /** Layout mode: list (single column) or grid (two columns) */
  layout: ExperienceLayout;
}

/**
 * Renders experience cards in either list or grid layout.
 * Applies theme button styles to each card.
 */
export function ExperienceCards({ experiences, layout }: ExperienceCardsProps) {
  if (experiences.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-center text-sm opacity-60">
        <p>No experiences added yet</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "gap-3",
        layout === "list" ? "flex flex-col" : "grid grid-cols-2"
      )}
    >
      {experiences.map((experience) => (
        <ExperienceCard
          key={experience.experienceId}
          experience={experience}
        />
      ))}
    </div>
  );
}

/**
 * Individual experience card styled with theme button settings.
 */
function ExperienceCard({ experience }: { experience: EventExperienceLink }) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  return (
    <button
      type="button"
      className={cn(
        "w-full p-4 text-left transition-transform active:scale-[0.98]",
        "min-h-[44px]" // Touch target size
      )}
      style={{
        backgroundColor: buttonBgColor,
        color: buttonTextColor,
        borderRadius: buttonRadius,
      }}
    >
      <span className="font-medium">
        {experience.label || `Experience ${experience.experienceId.slice(0, 6)}`}
      </span>
    </button>
  );
}
