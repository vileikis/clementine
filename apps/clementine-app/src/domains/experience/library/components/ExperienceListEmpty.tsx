/**
 * ExperienceListEmpty Component
 *
 * Empty state component for the experience library.
 * Supports two variants:
 * - no-experiences: No experiences exist at all
 * - no-matches: No experiences match the current filter
 */
import type { ExperienceProfile } from '@/domains/experience/shared'
import { profileMetadata } from '@/domains/experience/shared'
import { Button } from '@/ui-kit/ui/button'
import { Card } from '@/ui-kit/ui/card'

interface ExperienceListEmptyProps {
  /** Empty state variant */
  variant: 'no-experiences' | 'no-matches'
  /** Callback to navigate to create page */
  onCreate?: () => void
  /** Callback to clear the profile filter */
  onClearFilter?: () => void
  /** Current profile filter (for no-matches variant) */
  profile?: ExperienceProfile
}

/**
 * Empty state component for experience library
 *
 * @example
 * ```tsx
 * // No experiences at all
 * <ExperienceListEmpty
 *   variant="no-experiences"
 *   onCreate={() => navigate('/create')}
 * />
 *
 * // No experiences matching filter
 * <ExperienceListEmpty
 *   variant="no-matches"
 *   profile="survey"
 *   onClearFilter={() => setFilter(null)}
 * />
 * ```
 */
export function ExperienceListEmpty({
  variant,
  onCreate,
  onClearFilter,
  profile,
}: ExperienceListEmptyProps) {
  if (variant === 'no-experiences') {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold">No experiences yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">
          Create your first experience to get started
        </p>
        {onCreate && <Button onClick={onCreate}>Create Experience</Button>}
      </Card>
    )
  }

  // no-matches variant
  const profileLabel = profile ? profileMetadata[profile].label : 'this type'

  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold">No {profileLabel} experiences</h3>
      <p className="text-muted-foreground mt-2 mb-4">
        Try a different filter or create a new experience
      </p>
      {onClearFilter && (
        <Button variant="outline" onClick={onClearFilter}>
          Clear Filter
        </Button>
      )}
    </Card>
  )
}
