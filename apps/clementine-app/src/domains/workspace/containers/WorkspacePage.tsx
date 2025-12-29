import { Link } from '@tanstack/react-router'
import { useWorkspace } from '../hooks/useWorkspace'

interface WorkspacePageProps {
  slug: string
}

/**
 * Workspace detail page
 *
 * Displays workspace information and future workspace-specific features.
 * Currently shows a placeholder - will be enhanced with workspace editor in future iterations.
 */
export function WorkspacePage({ slug }: WorkspacePageProps) {
  const { data: workspace, isLoading, error } = useWorkspace(slug)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-sm text-muted-foreground">
            Failed to load workspace: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Workspace not found
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            The workspace "{slug}" does not exist or has been deleted.
          </p>
          <Link
            to="/admin/workspaces"
            className="text-sm text-primary hover:underline"
          >
            Back to workspaces
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Workspace header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {workspace.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Slug:{' '}
            <code className="bg-muted px-2 py-1 rounded">{workspace.slug}</code>
          </p>
        </div>

        {/* Placeholder content */}
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Workspace Editor</h3>
          <p className="text-sm text-muted-foreground">
            Workspace editing features will be added here in future iterations.
          </p>
        </div>
      </div>
    </div>
  )
}
