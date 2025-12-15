"use client"

import { cn } from "@/lib/utils"
import { useEventTheme } from "@/features/theming"
import type { Experience } from "@/features/experiences"
import type { EventExperienceLink, ExperienceLayout } from "@/features/events/types/event.types"

interface ExperienceCardProps {
  experienceLink: EventExperienceLink
  experience?: Experience
  layout: ExperienceLayout
  /** Optional click handler - when provided, card becomes interactive */
  onClick?: () => void
}

/**
 * Individual experience card with subtle styling.
 * - List layout: horizontal (media left, label right)
 * - Grid layout: vertical (media top, label bottom)
 *
 * When onClick is provided, card becomes a clickable button.
 * When onClick is undefined (admin preview), card is non-interactive.
 */
export function ExperienceCard({
  experienceLink,
  experience,
  layout,
  onClick,
}: ExperienceCardProps) {
  const { theme } = useEventTheme()

  // Use label from link, fall back to experience name, then placeholder
  const displayName =
    experienceLink.label || experience?.name || "Untitled Experience"

  // Get preview media if available
  const previewUrl = experience?.previewMediaUrl

  // Determine if card is interactive
  const isClickable = onClick !== undefined

  // Common button/div props for accessibility
  const interactiveProps = isClickable
    ? {
        onClick,
        role: "button" as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
          }
        },
      }
    : {}

  // Grid layout: vertical card with media on top
  if (layout === "grid") {
    return (
      <div
        {...interactiveProps}
        className={cn(
          "w-full text-center transition-transform",
          "min-h-[44px] overflow-hidden flex flex-col",
          "bg-white/10 backdrop-blur-sm rounded-lg border border-white/20",
          isClickable && "cursor-pointer active:scale-[0.98] hover:bg-white/15"
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
      </div>
    )
  }

  // List layout: horizontal card with media on left
  return (
    <div
      {...interactiveProps}
      className={cn(
        "w-full text-left transition-transform",
        "min-h-[44px] overflow-hidden flex items-center gap-3",
        "bg-white/10 backdrop-blur-sm rounded-lg border border-white/20",
        isClickable && "cursor-pointer active:scale-[0.98] hover:bg-white/15"
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
    </div>
  )
}
