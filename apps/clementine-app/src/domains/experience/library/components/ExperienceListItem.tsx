/**
 * ExperienceListItem Component
 *
 * Card component displaying a single experience in the library list.
 * Shows thumbnail (if available), name, profile badge, and status.
 * Includes context menu with rename and delete actions.
 */
import { Link } from '@tanstack/react-router'
import { Image as ImageIcon, MoreVertical } from 'lucide-react'

import { ProfileBadge } from './ProfileBadge'
import type { Experience } from '@/domains/experience/shared'
import { Button } from '@/ui-kit/ui/button'
import { Card } from '@/ui-kit/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'

interface ExperienceListItemProps {
  /** Experience data to display */
  experience: Experience
  /** Workspace slug for navigation */
  workspaceSlug: string
  /** Render prop for context menu items (allows parent to handle dialogs) */
  renderMenuItems?: () => React.ReactNode
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

/**
 * List item component for experience library
 *
 * @example
 * ```tsx
 * <ExperienceListItem
 *   experience={experience}
 *   workspaceSlug="my-workspace"
 *   renderMenuItems={() => (
 *     <>
 *       <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
 *       <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
 *     </>
 *   )}
 * />
 * ```
 */
export function ExperienceListItem({
  experience,
  workspaceSlug,
  renderMenuItems,
}: ExperienceListItemProps) {
  const publishStatus = getPublishStatus(experience)

  return (
    <Card className="p-4">
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
        <Link
          to="/workspace/$workspaceSlug/experiences/$experienceId"
          params={{ workspaceSlug, experienceId: experience.id }}
          className="flex-1 min-w-0"
        >
          <h3 className="font-semibold text-lg truncate">{experience.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <ProfileBadge profile={experience.profile} />
            <span className="text-sm text-muted-foreground">
              {publishStatus}
            </span>
          </div>
        </Link>

        {/* Context menu */}
        {renderMenuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {renderMenuItems()}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  )
}
