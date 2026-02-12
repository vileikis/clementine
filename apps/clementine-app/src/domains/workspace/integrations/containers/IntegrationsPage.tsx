/**
 * IntegrationsPage
 *
 * Workspace-level integrations management page.
 * Renders integration cards (starting with Dropbox).
 */
import { WorkspaceDropboxCard } from '@/domains/workspace/integrations/components/WorkspaceDropboxCard'
import type { Workspace } from '@clementine/shared'

interface IntegrationsPageProps {
  workspace: Workspace
  workspaceSlug: string
}

export function IntegrationsPage({
  workspace,
  workspaceSlug,
}: IntegrationsPageProps) {
  const integration = workspace.integrations?.dropbox ?? null

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <WorkspaceDropboxCard
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
          integration={integration}
          isLoading={false}
        />
      </div>
    </div>
  )
}
