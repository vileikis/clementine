/**
 * ExperienceIdentityBadge Component
 *
 * Clickable badge showing experience thumbnail + name.
 * Displayed in TopNavBar, opens ExperienceDetailsDialog on click.
 */
import { ImageIcon, Pencil } from 'lucide-react'

import type { Experience } from '@/domains/experience/shared'

interface ExperienceIdentityBadgeProps {
  experience: Experience
  onClick: () => void
}

export function ExperienceIdentityBadge({
  experience,
  onClick,
}: ExperienceIdentityBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
    >
      {/* Thumbnail */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
        {experience.media?.url ? (
          <img
            src={experience.media.url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <span className="max-w-[200px] truncate text-sm font-medium">
        {experience.name}
      </span>

      {/* Pencil icon (visible on hover) */}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
