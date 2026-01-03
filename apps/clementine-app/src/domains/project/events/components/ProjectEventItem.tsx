// ProjectEventItem component
// Individual project event row with activation switch and context menu

'use client'

import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useActivateProjectEvent } from '../hooks/useActivateProjectEvent'
import { RenameProjectEventDialog } from './RenameProjectEventDialog'
import { DeleteProjectEventDialog } from './DeleteProjectEventDialog'
import type { ProjectEvent } from '../schemas/project-event.schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-kit/components/ui/dropdown-menu'
import { Button } from '@/ui-kit/components/button'
import { Switch } from '@/ui-kit/components/switch'

export interface ProjectEventItemProps {
  /** Project event to display */
  event: ProjectEvent

  /** Project ID (for navigation/mutations) */
  projectId: string

  /** Whether this event is currently active */
  isActive: boolean
}

/**
 * ProjectEventItem component
 * Displays a single project event in the list with activation switch and context menu
 *
 * Features:
 * - Visual indication of active status (green dot + "Active" label)
 * - Activation/deactivation switch (admin-only operation)
 * - Context menu with rename action
 * - Loading state during activation
 *
 * @example
 * ```tsx
 * <ProjectEventItem
 *   event={event}
 *   projectId={projectId}
 *   isActive={isActive}
 * />
 * ```
 */
export function ProjectEventItem({
  event,
  projectId,
  isActive,
}: ProjectEventItemProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const activateProjectEvent = useActivateProjectEvent(projectId)
  const navigate = useNavigate()
  const { workspaceSlug } = useParams({ strict: false })

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        // Activate this event
        await activateProjectEvent.mutateAsync({ eventId: event.id, projectId })
      } else {
        // Deactivate (set activeEventId to null)
        await activateProjectEvent.mutateAsync({ eventId: null, projectId })
      }
    } catch (error) {
      // Show error notification
      toast.error(
        checked
          ? 'Failed to activate event. Please try again.'
          : 'Failed to deactivate event. Please try again.',
      )

      // Log error for debugging
      console.error('Event activation toggle failed:', error)
    }
  }

  const handleEventClick = () => {
    navigate({
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
      params: {
        workspaceSlug: workspaceSlug as string,
        projectId,
        eventId: event.id,
      },
    })
  }

  return (
    <>
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer gap-4 min-h-[44px]"
        role="listitem"
        onClick={handleEventClick}
      >
        {/* Event name and status */}
        <div className="flex flex-col gap-1 flex-1">
          <h4 className="font-medium">{event.name}</h4>
          {isActive && (
            <span className="text-xs text-green-600 font-medium">● Active</span>
          )}
        </div>

        {/* Controls: activation switch + context menu */}
        <div
          className="flex items-center gap-3 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Activation switch */}
          <div className="flex items-center gap-2">
            <label
              htmlFor={`activate-${event.id}`}
              className="text-sm text-muted-foreground hidden sm:inline"
            >
              Active
            </label>
            <Switch
              id={`activate-${event.id}`}
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={activateProjectEvent.isPending}
              aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${event.name}`}
            />
          </div>

          {/* Context menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label={`Actions for ${event.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onClick={() => setRenameDialogOpen(true)}
                className="min-h-[44px] cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive min-h-[44px] cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename dialog */}
      <RenameProjectEventDialog
        eventId={event.id}
        projectId={projectId}
        initialName={event.name}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      />

      {/* Delete dialog */}
      <DeleteProjectEventDialog
        eventId={event.id}
        projectId={projectId}
        eventName={event.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  )
}
