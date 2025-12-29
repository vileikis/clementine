import { createFileRoute } from '@tanstack/react-router'

/**
 * Projects page route (placeholder)
 *
 * Route: /workspace/:workspaceSlug/projects
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Placeholder page for future project management features.
 * Workspace context is maintained via parent route.
 */
export const Route = createFileRoute('/workspace/$workspaceSlug/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Projects</h1>
      <p className="text-muted-foreground mt-2">
        Project management features coming soon
      </p>
    </div>
  )
}
