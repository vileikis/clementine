/**
 * ExperienceCard Component (Guest Domain)
 *
 * Interactive card component for displaying experiences on the welcome screen.
 * Uses themed styling from context and handles click interactions for experience selection.
 *
 * Note: This is different from @domains/event/experiences/ExperienceCard which is for edit mode.
 * This component is specifically for guest-facing run mode with session creation.
 */
import type { CSSProperties } from 'react'
import { useThemeWithOverride } from '@/shared/theming'
import { cn } from '@/shared/utils'
import type { ExperienceCardData } from '../hooks/useGuestAccess'

export interface ExperienceCardProps {
  /** Experience data for display */
  experience: ExperienceCardData
  /** Layout mode from event config */
  layout: 'list' | 'grid'
  /** Callback when card is clicked */
  onSelect: (experienceId: string) => void
  /** Loading state while creating session */
  isLoading?: boolean
}

/**
 * Interactive experience card for guest welcome screen
 *
 * @example
 * ```tsx
 * <ExperienceCard
 *   experience={experience}
 *   layout="list"
 *   onSelect={handleSelect}
 *   isLoading={selectingId === experience.id}
 * />
 * ```
 */
export function ExperienceCard({
  experience,
  layout,
  onSelect,
  isLoading = false,
}: ExperienceCardProps) {
  const theme = useThemeWithOverride()

  const displayName = experience.name || 'Untitled Experience'

  // Themed card styles using color-mix for semi-transparent backgrounds
  const cardStyle: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8%, transparent)`,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: `color-mix(in srgb, ${theme.primaryColor} 20%, transparent)`,
    fontFamily: theme.fontFamily ?? undefined,
  }

  // Themed placeholder styles
  const placeholderStyle: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 10%, transparent)`,
    color: `color-mix(in srgb, ${theme.text.color} 40%, transparent)`,
  }

  // Text color style
  const textStyle: CSSProperties = {
    color: theme.text.color,
  }

  // Hover style for cards
  const hoverBgColor = `color-mix(in srgb, ${theme.primaryColor} 15%, transparent)`

  // Base classes
  const cardClasses = cn(
    'flex gap-3 p-3 rounded-lg min-h-[44px] transition-colors cursor-pointer select-none',
    'focus:outline-none focus:ring-2',
    {
      'flex-row items-center': layout === 'list',
      'flex-col': layout === 'grid',
      'opacity-50 cursor-wait': isLoading,
    },
  )

  const thumbnailClasses = cn('rounded-md overflow-hidden', {
    'w-16 h-16 shrink-0': layout === 'list',
    'w-full aspect-video': layout === 'grid',
  })

  const handleClick = () => {
    if (!isLoading) {
      onSelect(experience.id)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isLoading && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onSelect(experience.id)
    }
  }

  return (
    <button
      type="button"
      className={cardClasses}
      style={{
        ...cardStyle,
        // @ts-expect-error CSS custom property for focus ring color
        '--tw-ring-color': theme.primaryColor,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = hoverBgColor
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = cardStyle.backgroundColor as string
      }}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {/* Thumbnail */}
      <div className={thumbnailClasses} style={placeholderStyle}>
        {experience.thumbnailUrl ? (
          <img
            src={experience.thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col',
          layout === 'list' ? 'flex-1 min-w-0' : '',
        )}
      >
        <h3 className="font-medium text-sm truncate" style={textStyle}>
          {displayName}
        </h3>
        {isLoading && (
          <span className="text-xs opacity-60" style={textStyle}>
            Starting...
          </span>
        )}
      </div>
    </button>
  )
}
