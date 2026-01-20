/**
 * ExperienceCardList Component
 *
 * Container component for rendering a list or grid of experience cards
 * on the guest welcome screen.
 */
import { ExperienceCard } from './ExperienceCard'
import { cn } from '@/shared/utils'
import type { ExperienceCardData } from '../hooks/useGuestAccess'

export interface ExperienceCardListProps {
  /** List of experiences to display */
  experiences: ExperienceCardData[]
  /** Layout mode from event config */
  layout: 'list' | 'grid'
  /** Callback when an experience is selected */
  onSelect: (experienceId: string) => void
  /** ID of experience currently being selected (for loading state) */
  selectingId?: string | null
}

/**
 * Experience card list with layout support
 *
 * @example
 * ```tsx
 * <ExperienceCardList
 *   experiences={experiences}
 *   layout={welcome.layout}
 *   onSelect={handleSelectExperience}
 *   selectingId={selectingId}
 * />
 * ```
 */
export function ExperienceCardList({
  experiences,
  layout,
  onSelect,
  selectingId = null,
}: ExperienceCardListProps) {
  return (
    <div
      className={cn('w-full', {
        'space-y-3': layout === 'list',
        'grid grid-cols-2 gap-3': layout === 'grid',
      })}
    >
      {experiences.map((experience) => (
        <ExperienceCard
          key={experience.id}
          experience={experience}
          layout={layout}
          onSelect={onSelect}
          isLoading={selectingId === experience.id}
        />
      ))}
    </div>
  )
}
