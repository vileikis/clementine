import { createFileRoute } from '@tanstack/react-router'

/**
 * Settings tab route
 *
 * Route: /workspace/:workspaceSlug/projects/:projectId/events/:eventId/settings
 * Access: Admin only (enforced by parent route)
 *
 * WIP: Settings editor (overlays, sharing) placeholder
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
)({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Settings Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Settings editor (overlays, sharing) coming soon
      </p>
    </div>
  )
}
