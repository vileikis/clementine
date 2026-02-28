/**
 * ConnectExperienceItem Component
 *
 * List item within the connect drawer for selecting experiences.
 * Shows thumbnail, name, type badge, and assigned state.
 */
import type { Experience } from '@/domains/experience/shared'
import { TypeBadge } from '@/domains/experience/library/components/TypeBadge'
import { Badge } from '@/ui-kit/ui/badge'
import { cn } from '@/shared/utils/style-utils'

export interface ConnectExperienceItemProps {
  /** Experience data */
  experience: Experience

  /** Whether this experience is already assigned (disabled state) */
  isAssigned: boolean

  /** Callback when selected */
  onSelect: () => void
}

/**
 * List item for selecting an experience from the drawer
 *
 * Features:
 * - Shows thumbnail, name, and profile badge
 * - Disabled state when already assigned
 * - Displays "(in use)" badge when assigned
 * - Clickable when available
 *
 * @example
 * ```tsx
 * <ConnectExperienceItem
 *   experience={experience}
 *   isAssigned={assignedIds.has(experience.id)}
 *   onSelect={() => handleConnect(experience.id)}
 * />
 * ```
 */
export function ConnectExperienceItem({
  experience,
  isAssigned,
  onSelect,
}: ConnectExperienceItemProps) {
  const handleClick = () => {
    if (!isAssigned) {
      onSelect()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isAssigned}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground text-left',
        'transition-colors',
        {
          // Interactive state when available
          'cursor-pointer hover:bg-accent': !isAssigned,
          // Disabled state when assigned
          'opacity-50 cursor-not-allowed': isAssigned,
        },
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
        {experience.media?.url ? (
          <img
            src={experience.media.url}
            alt={experience.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder when no media
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate flex-1">
            {experience.name}
          </h3>
          {isAssigned && (
            <Badge variant="secondary" className="text-xs">
              In use
            </Badge>
          )}
        </div>
        <TypeBadge type={experience.draftType} />
      </div>
    </button>
  )
}
