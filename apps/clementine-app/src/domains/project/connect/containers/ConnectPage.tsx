import { getRouteApi } from '@tanstack/react-router'
import { DropboxCard } from '../components/DropboxCard'
import { useDropboxExport } from '../hooks/useDropboxExport'
import { useProject } from '@/domains/project/shared/hooks'
import { useWorkspace } from '@/domains/workspace'

const route = getRouteApi(
  '/workspace/$workspaceSlug/projects/$projectId/connect',
)

export function ConnectPage() {
  const { workspaceSlug, projectId } = route.useParams()
  const { data: project } = useProject(projectId)
  const { data: workspace, isLoading } = useWorkspace(workspaceSlug)

  const integration = workspace?.integrations?.dropbox ?? null
  const { isEnabled, toggle, isToggling } = useDropboxExport(project)

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md space-y-6 px-4">
        <DropboxCard
          workspaceSlug={workspaceSlug}
          projectName={project?.name ?? 'Project'}
          integration={integration}
          isLoading={isLoading}
          isExportEnabled={isEnabled}
          onToggleExport={toggle}
          isToggling={isToggling}
        />
      </div>
    </div>
  )
}
