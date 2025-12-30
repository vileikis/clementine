import { useCreateProject, useDeleteProject, useProjects } from '../hooks'
import { ProjectListEmpty, ProjectListItem } from '../components'
import { Button } from '@/ui-kit/components/button'
import { Skeleton } from '@/ui-kit/components/skeleton'

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

  const handleCreateProject = () => {
    createProject.mutate({ workspaceId })
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
