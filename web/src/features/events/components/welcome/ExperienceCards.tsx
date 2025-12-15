"use client";

import { cn } from "@/lib/utils";
import { useEventTheme } from "@/features/theming";
import type { Experience } from "@/features/experiences";
import type { EventExperienceLink, ExperienceLayout } from "../../types/event.types";

interface ExperienceCardsProps {
  /** List of enabled experiences to display */
  experiences: EventExperienceLink[];
  /** Layout mode: list (single column) or grid (two columns) */
  layout: ExperienceLayout;
  /** Experience details by ID */
  experiencesMap?: Record<string, Experience>;
}

/**
 * Renders experience cards in either list or grid layout.
 * Cards use subtle styling without theme button colors.
 */
export function ExperienceCards({
  experiences,
  layout,
  experiencesMap,
}: ExperienceCardsProps) {
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
        "gap-3 mx-auto",
        layout === "list" ? "flex flex-col max-w-sm" : "grid grid-cols-2 max-w-md"
      )}
    >
      {experiences.map((experienceLink) => {
        const experience = experiencesMap?.[experienceLink.experienceId];
        return (
          <ExperienceCard
            key={experienceLink.experienceId}
            experienceLink={experienceLink}
            experience={experience}
            layout={layout}
          />
        );
      })}
    </div>
  );
}

interface ExperienceCardProps {
  experienceLink: EventExperienceLink;
  experience?: Experience;
  layout: ExperienceLayout;
}

/**
 * Individual experience card with subtle styling.
 * - List layout: horizontal (media left, label right)
 * - Grid layout: vertical (media top, label bottom)
 */
function ExperienceCard({ experienceLink, experience, layout }: ExperienceCardProps) {
  const { theme } = useEventTheme();

  // Use label from link, fall back to experience name, then placeholder
  const displayName =
    experienceLink.label || experience?.name || "Untitled Experience";

  // Get preview media if available
  const previewUrl = experience?.previewMediaUrl;

  // Grid layout: vertical card with media on top
  if (layout === "grid") {
    return (
      <button
        type="button"
        className={cn(
          "w-full text-center transition-transform active:scale-[0.98]",
          "min-h-[44px] overflow-hidden flex flex-col",
          "bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
        )}
      >
        {/* Media - square aspect ratio on top */}
        {previewUrl && (
          <div
            className="w-full aspect-square bg-cover bg-center rounded-t-lg"
            style={{ backgroundImage: `url(${previewUrl})` }}
          />
        )}

        {/* Label below */}
        <div className="p-3 flex-1 flex items-center justify-center">
          <span
            className="font-medium text-sm line-clamp-2"
            style={{ color: theme.text.color }}
          >
            {displayName}
          </span>
        </div>
      </button>
    );
  }

  // List layout: horizontal card with media on left
  return (
    <button
      type="button"
      className={cn(
        "w-full text-left transition-transform active:scale-[0.98]",
        "min-h-[44px] overflow-hidden flex items-center gap-3",
        "bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
      )}
    >
      {/* Media thumbnail on left */}
      {previewUrl && (
        <div
          className="h-14 w-14 shrink-0 bg-cover bg-center rounded-l-lg"
          style={{ backgroundImage: `url(${previewUrl})` }}
        />
      )}

      {/* Label on right */}
      <div className={cn("flex-1 py-3", previewUrl ? "pr-3" : "px-4")}>
        <span
          className="font-medium line-clamp-2"
          style={{ color: theme.text.color }}
        >
          {displayName}
        </span>
      </div>
    </button>
  );
}
