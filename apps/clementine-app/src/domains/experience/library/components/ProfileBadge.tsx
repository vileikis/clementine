/**
 * ProfileBadge Component
 *
 * Displays a colored badge indicating the experience profile type.
 * Colors follow the design system:
 * - freeform: blue
 * - survey: green
 * - story: purple
 */
import type { ExperienceProfile } from '@/domains/experience/shared'
import { Badge } from '@/ui-kit/ui/badge'
import { cn } from '@/shared/utils/style-utils'

/**
 * Color classes for each profile type
 */
const profileColors: Record<ExperienceProfile, string> = {
  freeform: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  survey: 'bg-green-100 text-green-800 hover:bg-green-100',
  story: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
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
