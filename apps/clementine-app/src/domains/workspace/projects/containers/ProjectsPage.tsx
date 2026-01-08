import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCreateProject, useDeleteProject, useProjects } from '../hooks'
import { ProjectListEmpty, ProjectListItem } from '../components'
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
  const navigate = useNavigate()

  const handleCreateProject = async () => {
    try {
      const result = await createProject.mutateAsync({
        workspaceId,
        workspaceSlug,
      })

      // Consumer handles navigation
      navigate({
        to: '/workspace/$workspaceSlug/projects/$projectId',
        params: {
          workspaceSlug: result.workspaceSlug,
          projectId: result.projectId,
        },
      })

      toast.success('Project created')
    } catch (error) {
      toast.error('Failed to create project')
    }
  }

  const handleDeleteProject = (projectId: string) => {
    deleteProject.mutate(projectId)
  }

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
        <div className="space-y-4">
          {projects?.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              onDelete={handleDeleteProject}
              isDeleting={deleteProject.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
