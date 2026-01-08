import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { RenameProjectDialog } from './RenameProjectDialog'
import type { Project } from '../types'
import { Badge } from '@/ui-kit/ui/badge'
import { Button } from '@/ui-kit/ui/button'
import { Card } from '@/ui-kit/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu'

interface ProjectListItemProps {
  project: Project
  workspaceId: string
  workspaceSlug: string
  onDelete: (projectId: string) => void
  isDeleting: boolean
}

export function ProjectListItem({
  project,
  workspaceId,
  workspaceSlug,
  onDelete,
  isDeleting,
}: ProjectListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)

  const handleDelete = () => {
    onDelete(project.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Link
            to="/workspace/$workspaceSlug/projects/$projectId"
            params={{ workspaceSlug, projectId: project.id }}
            className="flex-1"
          >
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <Badge
              variant={project.status === 'live' ? 'default' : 'secondary'}
            >
              {project.status}
            </Badge>
          </Link>

          {/* Context menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      {/* Rename dialog */}
      <RenameProjectDialog
        projectId={project.id}
        workspaceId={workspaceId}
        initialName={project.name}
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
      />

      {/* Delete dialog */}
      <DeleteProjectDialog
        open={showDeleteDialog}
        projectName={project.name}
        isDeleting={isDeleting}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
      />
    </>
  )
}
