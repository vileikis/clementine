/**
 * ProfileBadge Component
 *
 * Displays a colored badge indicating the experience profile type.
 * Colors use theme tokens with opacity modifiers:
 * - freeform: info (blue) for general purpose
 * - survey: success (green) for data collection
 * - story: accent for narrative experiences
 */
import type { ExperienceProfile } from '@/domains/experience/shared'
import { Badge } from '@/ui-kit/ui/badge'
import { cn } from '@/shared/utils/style-utils'

/**
 * Color classes for each profile type using theme tokens
 * Uses opacity modifiers for subtle backgrounds per design-system.md
 */
const profileColors: Record<ExperienceProfile, string> = {
  freeform: 'bg-info/10 text-info hover:bg-info/15',
  survey: 'bg-success/10 text-success hover:bg-success/15',
  story: 'bg-accent text-accent-foreground hover:bg-accent/80',
}

/**
 * Human-readable labels for each profile type
 */
const profileLabels: Record<ExperienceProfile, string> = {
  freeform: 'Freeform',
  survey: 'Survey',
  story: 'Story',
}

interface ProfileBadgeProps {
  /** The profile type to display */
  profile: ExperienceProfile
  /** Additional CSS classes */
  className?: string
}

/**
 * Colored badge component for experience profile types
 *
 * @example
 * ```tsx
 * <ProfileBadge profile="survey" />
 * // Renders: green badge with "Survey" text
 * ```
 */
export function ProfileBadge({ profile, className }: ProfileBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(profileColors[profile], className)}
    >
      {profileLabels[profile]}
    </Badge>
  )
}
