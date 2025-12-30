import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import type { Project } from '../types'
import { Badge } from '@/ui-kit/components/badge'
import { Button } from '@/ui-kit/components/button'
import { Card } from '@/ui-kit/components/card'

interface ProjectListItemProps {
  project: Project
  workspaceSlug: string
  onDelete: (projectId: string) => void
  isDeleting: boolean
}

export function ProjectListItem({
  project,
  workspaceSlug,
  onDelete,
  isDeleting,
}: ProjectListItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

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
