/**
 * TypeBadge Component
 *
 * Displays a colored badge indicating the experience type.
 * Uses typeMetadata for labels and maps types to theme color tokens.
 *
 * @see specs/081-experience-type-flattening — US2
 */
import type { ExperienceType } from '@clementine/shared'
import { typeMetadata } from '@/domains/experience/shared'
import { Badge } from '@/ui-kit/ui/badge'
import { cn } from '@/shared/utils/style-utils'

/**
 * Color classes for each experience type using theme tokens.
 * Uses opacity modifiers for subtle backgrounds per design-system.md.
 */
const typeColors: Record<ExperienceType, string> = {
  photo: 'bg-info/10 text-info hover:bg-info/15',
  'ai.image': 'bg-primary/10 text-primary hover:bg-primary/15',
  'ai.video': 'bg-primary/10 text-primary hover:bg-primary/15',
  survey: 'bg-success/10 text-success hover:bg-success/15',
  gif: 'bg-info/10 text-info hover:bg-info/15',
  video: 'bg-info/10 text-info hover:bg-info/15',
}

interface TypeBadgeProps {
  /** The experience type to display */
  type: ExperienceType
  /** Additional CSS classes */
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const meta = typeMetadata[type]

  return (
    <Badge
      variant="secondary"
      className={cn(typeColors[type], className)}
    >
      {meta.label}
    </Badge>
  )
}
