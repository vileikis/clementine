import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceId/')({
  component: WorkspaceRedirect,
})

function WorkspaceRedirect() {
  const { workspaceId } = Route.useParams()
  return (
    <Navigate to="/workspace/$workspaceId/projects" params={{ workspaceId }} />
  )
}
