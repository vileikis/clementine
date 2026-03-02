/**
 * ExperienceCard Component
 *
 * Card component for displaying experience in welcome screen preview.
 * Grid layout: full-bleed image with gradient overlay and white text.
 * List layout: horizontal row with thumbnail and type metadata.
 * Supports different layouts (list/grid) and modes (edit/run).
 */
import type { CSSProperties } from 'react'
import type { ExperienceType } from '@clementine/shared'
import type { Theme } from '@/shared/theming'
import { useThemeWithOverride } from '@/shared/theming'
import { cn } from '@/shared/utils/style-utils'
import { getExperienceTypeIcon } from '@/domains/experience/shared'
import { typeMetadata } from '@/domains/experience/shared/types/type-metadata'

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
  /** Experience type */
  type: ExperienceType
}

export interface ExperienceCardProps {
  /** Experience data to display */
  experience: ExperienceCardData

  /**
   * Layout mode - affects card dimensions and arrangement
   * - list: Full width, horizontal row with 80x80 thumbnail
   * - grid: Square card with full-bleed image and gradient overlay
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

export function ExperienceCard({
  experience,
  layout,
  mode,
  onClick,
  theme: themeOverride,
}: ExperienceCardProps) {
  const theme = useThemeWithOverride(themeOverride)
  const isInteractive = mode === 'run' && onClick

  const displayName = experience.name || 'Untitled Experience'
  const TypeIcon = getExperienceTypeIcon(experience.type)
  const typeLabel = typeMetadata[experience.type].label

  const handleClick = () => {
    if (isInteractive) {
      onClick()
    }
  }

  if (layout === 'grid') {
    return (
      <GridCard
        experience={experience}
        displayName={displayName}
        TypeIcon={TypeIcon}
        theme={theme}
        isInteractive={!!isInteractive}
        onClick={handleClick}
      />
    )
  }

  return (
    <ListCard
      experience={experience}
      displayName={displayName}
      TypeIcon={TypeIcon}
      typeLabel={typeLabel}
      theme={theme}
      isInteractive={!!isInteractive}
      onClick={handleClick}
    />
  )
}

// --- Grid Card ---

function GridCard({
  experience,
  displayName,
  TypeIcon,
  theme,
  isInteractive,
  onClick,
}: {
  experience: ExperienceCardData
  displayName: string
  TypeIcon: React.ComponentType<{ className?: string }>
  theme: Theme
  isInteractive: boolean
  onClick: () => void
}) {
  const content = (
    <div className="relative aspect-square w-full">
      {experience.thumbnailUrl ? (
        <img
          src={experience.thumbnailUrl}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <TypeIcon className="size-10 text-white/80" />
        </div>
      )}

      {/* Type indicator — top-left */}
      <div className="absolute top-2 left-2 z-10 rounded-full bg-black/50 p-2">
        <TypeIcon className="size-[16px] text-white drop-shadow-md" />
      </div>

      {/* Bottom gradient overlay with title */}
      <div
        className="absolute inset-x-0 bottom-0 p-3 pt-10"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      >
        <h3 className="font-semibold text-lg text-white line-clamp-2 text-center leading-snug">
          {displayName}
        </h3>
      </div>
    </div>
  )

  const baseClasses = cn(
    'rounded-lg overflow-hidden transition-all duration-150 ease-out cursor-pointer select-none',
    'hover:scale-[1.02] active:scale-[0.97] active:duration-75',
  )

  if (isInteractive) {
    return (
      <button
        type="button"
        className={cn(baseClasses, 'focus:outline-none focus:ring-2')}
        style={{
          // @ts-expect-error CSS custom property for focus ring color
          '--tw-ring-color': theme.primaryColor,
        }}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return <div className={baseClasses}>{content}</div>
}

// --- List Card ---

function ListCard({
  experience,
  displayName,
  TypeIcon,
  typeLabel,
  theme,
  isInteractive,
  onClick,
}: {
  experience: ExperienceCardData
  displayName: string
  TypeIcon: React.ComponentType<{ className?: string }>
  typeLabel: string
  theme: Theme
  isInteractive: boolean
  onClick: () => void
}) {
  const placeholderStyle: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 15%, transparent)`,
  }

  const cardStyle: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8%, transparent)`,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: `color-mix(in srgb, ${theme.primaryColor} 20%, transparent)`,
    fontFamily: theme.fontFamily ?? undefined,
  }

  const hoverBg = `color-mix(in srgb, ${theme.primaryColor} 15%, transparent)`

  const content = (
    <div className="flex items-center gap-3 p-2">
      {/* Thumbnail */}
      <div
        className="size-20 shrink-0 rounded-md overflow-hidden"
        style={!experience.thumbnailUrl ? placeholderStyle : undefined}
      >
        {experience.thumbnailUrl ? (
          <img
            src={experience.thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="size-6 text-black/80" />
          </div>
        )}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h3
          className="font-medium text-base truncate text-left"
          style={{ color: theme.text.color }}
        >
          {displayName}
        </h3>
        <div
          className="flex items-center gap-1.5 text-sm"
          style={{
            color: `color-mix(in srgb, ${theme.text.color} 60%, transparent)`,
          }}
        >
          <TypeIcon className="size-3.5 shrink-0" />
          <span>{typeLabel}</span>
        </div>
      </div>
    </div>
  )

  const baseClasses = cn(
    'rounded-lg overflow-hidden transition-all duration-150 ease-out cursor-pointer select-none w-full',
    'hover:scale-[1.02] active:scale-[0.97] active:duration-75',
  )

  if (isInteractive) {
    return (
      <button
        type="button"
        className={cn(baseClasses, 'focus:outline-none focus:ring-2')}
        style={{
          ...cardStyle,
          // @ts-expect-error CSS custom property for focus ring color
          '--tw-ring-color': theme.primaryColor,
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = cardStyle.backgroundColor!
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={baseClasses}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = cardStyle.backgroundColor!
      }}
    >
      {content}
    </div>
  )
}
