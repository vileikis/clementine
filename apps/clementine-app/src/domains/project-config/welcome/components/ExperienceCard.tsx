/**
 * ExperienceCard Component
 *
 * Card component for displaying experience in welcome screen preview.
 * Shows thumbnail and name with theme-derived styling.
 * Supports different layouts (list/grid) and modes (edit/run).
 */
import type { CSSProperties } from 'react'
import type { Theme } from '@/shared/theming'
import { useThemeWithOverride } from '@/shared/theming'
import { cn } from '@/shared/utils/style-utils'

/**
 * Minimal experience data needed for card display
 */
export interface ExperienceCardData {
  /** Experience document ID */
  id: string
  /** Display name */
  name: string
  /** Thumbnail URL (null if no media) */
  thumbnailUrl: string | null
}

export interface ExperienceCardProps {
  /** Experience data to display */
  experience: ExperienceCardData

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

  /** Click handler (only used in run mode) */
  onClick?: () => void

  /** Theme override for use without ThemeProvider */
  theme?: Theme
}

/**
 * Card component for displaying experiences
 *
 * @example
 * ```tsx
 * // List layout (edit mode - WYSIWYG preview)
 * <ExperienceCard
 *   experience={experience}
 *   layout="list"
 *   mode="edit"
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
  onClick,
  theme: themeOverride,
}: ExperienceCardProps) {
  const theme = useThemeWithOverride(themeOverride)
  const isInteractive = mode === 'run' && onClick

  // Display name with fallback for empty names
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

  // Base classes (layout and interaction behavior, no hardcoded colors)
  // Edit mode is WYSIWYG - same visual appearance as run mode, just non-interactive
  const cardClasses = cn(
    'flex gap-3 p-3 rounded-lg min-h-[44px] transition-all duration-150 ease-out cursor-pointer select-none',
    'hover:scale-[1.02] active:scale-[0.97] active:duration-75',
    {
      // Layout-specific styles
      'flex-row items-center': layout === 'list',
      'flex-col': layout === 'grid',
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }

  // Card content (shared between interactive and non-interactive variants)
  const cardContent = (
    <>
      {/* Thumbnail */}
      <div
        className={cn(thumbnailClasses, 'rounded-md overflow-hidden')}
        style={placeholderStyle}
      >
        {experience.thumbnailUrl ? (
          <img
            src={experience.thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder when no media
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
      </div>
    </>
  )

  // Hover style for cards (slightly increased opacity)
  const hoverStyle: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 15%, transparent)`,
  }

  // Render as interactive button when in run mode with onClick
  if (isInteractive) {
    return (
      <button
        type="button"
        className={cn(cardClasses, 'focus:outline-none focus:ring-2 group')}
        style={{
          ...cardStyle,
          // @ts-expect-error CSS custom property for focus ring color
          '--tw-ring-color': theme.primaryColor,
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor!
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = cardStyle.backgroundColor!
        }}
      >
        {cardContent}
      </button>
    )
  }

  // Render as non-interactive div otherwise (edit mode - WYSIWYG with hover but no click)
  return (
    <div
      className={cardClasses}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor!
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = cardStyle.backgroundColor!
      }}
    >
      {cardContent}
    </div>
  )
}
