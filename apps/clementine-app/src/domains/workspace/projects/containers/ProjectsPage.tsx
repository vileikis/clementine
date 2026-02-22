import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  DeleteProjectDialog,
  ProjectListEmpty,
  ProjectListItem,
  RenameProjectDialog,
} from '../components'
import {
  useCreateProject,
  useDeleteProject,
  useDuplicateProject,
  useProjects,
} from '../hooks'
import type { Project } from '../types'
import type { MenuSection } from '@/shared/components/ContextDropdownMenu'
import { Button } from '@/ui-kit/ui/button'
import { Skeleton } from '@/ui-kit/ui/skeleton'

interface ProjectsPageProps {
  workspaceId: string
  workspaceSlug: string
}

export function ProjectsPage({
  workspaceId,
  workspaceSlug,
}: ProjectsPageProps) {
  const { data: projects, isLoading } = useProjects(workspaceId)
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const duplicateProject = useDuplicateProject()
  const navigate = useNavigate()

  // Dialog state
  const [renameProject, setRenameProject] = useState<Project | null>(null)
  const [deleteProjectTarget, setDeleteProjectTarget] =
    useState<Project | null>(null)

  const handleCreateProject = async () => {
    try {
      const result = await createProject.mutateAsync({
        workspaceId,
        workspaceSlug,
      })

      navigate({
        to: '/workspace/$workspaceSlug/projects/$projectId',
        params: {
          workspaceSlug: result.workspaceSlug,
          projectId: result.projectId,
        },
      })

      toast.success('Project created')
    } catch {
      toast.error('Failed to create project')
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteProjectTarget) return

    try {
      await deleteProject.mutateAsync(deleteProjectTarget.id)
      toast.success('Project deleted')
      setDeleteProjectTarget(null)
    } catch {
      toast.error('Failed to delete project')
    }
  }

  const handleDuplicate = async (project: Project) => {
    try {
      const result = await duplicateProject.mutateAsync({
        workspaceId,
        projectId: project.id,
      })
      toast.success(`Duplicated as "${result.name}"`)
    } catch {
      toast.error("Couldn't duplicate project")
    }
  }

  const getMenuSections = (project: Project): MenuSection[] => [
    {
      items: [
        {
          key: 'rename',
          label: 'Rename',
          icon: Pencil,
          onClick: () => setRenameProject(project),
        },
        {
          key: 'duplicate',
          label: 'Duplicate',
          icon: Copy,
          onClick: () => handleDuplicate(project),
          disabled: duplicateProject.isPending,
        },
      ],
    },
    {
      items: [
        {
          key: 'delete',
          label: 'Delete',
          icon: Trash2,
          onClick: () => setDeleteProjectTarget(project),
          destructive: true,
        },
      ],
    },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {projects && projects.length > 0 && (
          <Button onClick={handleCreateProject}>Create Project</Button>
        )}
      </div>

      {projects && projects.length === 0 ? (
        <ProjectListEmpty onCreateProject={handleCreateProject} />
      ) : (
        <div className="flex flex-col gap-4">
          {projects?.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              workspaceSlug={workspaceSlug}
              menuSections={getMenuSections(project)}
            />
          ))}
        </div>
      )}

      {/* Rename dialog */}
      {renameProject && (
        <RenameProjectDialog
          projectId={renameProject.id}
          workspaceId={workspaceId}
          initialName={renameProject.name}
          open={!!renameProject}
          onOpenChange={(open) => !open && setRenameProject(null)}
        />
      )}

      {/* Delete dialog */}
      {deleteProjectTarget && (
        <DeleteProjectDialog
          open={!!deleteProjectTarget}
          projectName={deleteProjectTarget.name}
          isDeleting={deleteProject.isPending}
          onOpenChange={(open) => !open && setDeleteProjectTarget(null)}
          onConfirm={handleDeleteProject}
        />
      )}
    </div>
  )
}
