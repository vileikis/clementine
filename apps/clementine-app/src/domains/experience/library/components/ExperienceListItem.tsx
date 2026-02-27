/**
 * ExperienceListItem Component
 *
 * Card component displaying a single experience in the library list.
 * Shows thumbnail (if available), name, type badge, and status.
 * Includes context menu with actions provided via sections prop.
 * Entire card is clickable for navigation with hover feedback.
 */
import { Link } from '@tanstack/react-router'
import { Image as ImageIcon, MoreVertical } from 'lucide-react'

import { TypeBadge } from './TypeBadge'
import type { Experience } from '@/domains/experience/shared'
import type { MenuSection } from '@/shared/components/ContextDropdownMenu'
import { Button } from '@/ui-kit/ui/button'
import { Card } from '@/ui-kit/ui/card'
import { ContextDropdownMenu } from '@/shared/components/ContextDropdownMenu'

interface ExperienceListItemProps {
  /** Experience data to display */
  experience: Experience
  /** Workspace slug for navigation */
  workspaceSlug: string
  /** Menu sections for ContextDropdownMenu */
  menuSections?: MenuSection[]
}

/**
 * Get publish status label for an experience
 */
function getPublishStatus(experience: Experience): string {
  if (!experience.published) return 'Draft'
  if (experience.publishedAt && experience.updatedAt > experience.publishedAt) {
    return 'Unpublished changes'
  }
  return 'Published'
}

export function ExperienceListItem({
  experience,
  workspaceSlug,
  menuSections,
}: ExperienceListItemProps) {
  const publishStatus = getPublishStatus(experience)

  return (
    <Link
      to="/workspace/$workspaceSlug/experiences/$experienceId"
      params={{ workspaceSlug, experienceId: experience.id }}
    >
      <Card className="cursor-pointer p-4 transition-colors hover:bg-accent/50">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {experience.media?.url ? (
              <img
                src={experience.media.url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {experience.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={experience.draftType} />
              <span className="text-sm text-muted-foreground">
                {publishStatus}
              </span>
            </div>
          </div>

          {/* Context menu */}
          {menuSections && (
            <div onClick={(e) => e.preventDefault()}>
              <ContextDropdownMenu
                trigger={
                  <Button variant="ghost" size="icon" className="h-11 w-11">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                }
                sections={menuSections}
              />
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
