/**
 * IntegrationsPage
 *
 * Workspace-level integrations management page.
 * Renders integration cards (starting with Dropbox).
 */
import { WorkspaceDropboxCard } from '../components/WorkspaceDropboxCard'
import type { DropboxIntegration, Workspace } from '@clementine/shared'

interface IntegrationsPageProps {
  workspace: Workspace
  workspaceSlug: string
}

export function IntegrationsPage({
  workspace,
  workspaceSlug,
}: IntegrationsPageProps) {
  const integration = (workspace as Record<string, unknown>)?.[
    'integrations'
  ] as { dropbox?: DropboxIntegration | null } | undefined

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <WorkspaceDropboxCard
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug}
          integration={integration?.dropbox ?? null}
          isLoading={false}
        />
      </div>
    </div>
  )
}
