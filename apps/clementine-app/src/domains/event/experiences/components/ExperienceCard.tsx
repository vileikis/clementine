/**
 * ExperienceCard Component
 *
 * Card component for displaying experience in welcome screen preview.
 * Shows thumbnail, name, and profile badge.
 * Supports different layouts (list/grid) and modes (edit/run).
 */
import type { Experience } from '@/domains/experience/shared'
import { ProfileBadge } from '@/domains/experience/library/components/ProfileBadge'
import { cn } from '@/shared/utils/style-utils'

export interface ExperienceCardProps {
  /** Experience data to display */
  experience: Experience

  /**
   * Layout mode - affects card dimensions and arrangement
   * - list: Full width, smaller thumbnail (64x64px)
   * - grid: 50% width, aspect ratio thumbnail (16:9)
   */
  layout: 'list' | 'grid'

  /**
   * Display mode
   * - edit: Non-interactive, shows enabled state
   * - run: Interactive, calls onClick
   */
  mode: 'edit' | 'run'

  /** Whether experience is enabled (affects opacity in edit mode) */
  enabled?: boolean

  /** Click handler (only used in run mode) */
  onClick?: () => void
}

/**
 * Card component for displaying experiences
 *
 * @example
 * ```tsx
 * // List layout (edit mode)
 * <ExperienceCard
 *   experience={experience}
 *   layout="list"
 *   mode="edit"
 *   enabled={true}
 * />
 *
 * // Grid layout (run mode)
 * <ExperienceCard
 *   experience={experience}
 *   layout="grid"
 *   mode="run"
 *   onClick={() => startExperience(experience.id)}
 * />
 * ```
 */
export function ExperienceCard({
  experience,
  layout,
  mode,
  enabled = true,
  onClick,
}: ExperienceCardProps) {
  const isInteractive = mode === 'run' && onClick
  const isDisabled = mode === 'edit' && !enabled

  // Base styles
  const cardClasses = cn(
    'flex gap-3 p-3 rounded-lg border bg-card text-card-foreground',
    {
      // Layout-specific styles
      'flex-row items-center': layout === 'list',
      'flex-col': layout === 'grid',

      // Interactive styles
      'cursor-pointer hover:bg-accent transition-colors': isInteractive,

      // Disabled state (dimmed in edit mode)
      'opacity-50': isDisabled,
    },
  )

  const thumbnailClasses = cn({
    // List layout: square thumbnail
    'w-16 h-16 shrink-0': layout === 'list',
    // Grid layout: aspect ratio thumbnail
    'w-full aspect-video': layout === 'grid',
  })

  const handleClick = () => {
    if (isInteractive) {
      onClick()
    }
  }

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Thumbnail */}
      <div
        className={cn(thumbnailClasses, 'rounded-md overflow-hidden bg-muted')}
      >
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
      <div
        className={cn(
          'flex flex-col gap-2',
          layout === 'list' ? 'flex-1 min-w-0' : '',
        )}
      >
        <h3 className="font-medium text-sm truncate">{experience.name}</h3>
        <ProfileBadge profile={experience.profile} />
      </div>
    </div>
  )
}
