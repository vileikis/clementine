/**
 * EventDesignerPage Container
 *
 * Layout shell for the event designer with vertical tabs navigation.
 * Provides a 2-column layout: left sidebar with tabs, right content area with outlet.
 */
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'

/**
 * EventDesignerPage component
 *
 * Renders the event designer interface with:
 * - Left sidebar: Vertical tabs for Welcome, Theme, Settings
 * - Right content area: Active tab content (rendered via Outlet)
 *
 * Uses TanStack Router's Link and useMatchRoute for type-safe navigation.
 */
export function EventDesignerPage() {
  const matchRoute = useMatchRoute()
  const { workspaceSlug, projectId, eventId } = useParams({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
  })

  const tabs = [
    {
      id: 'welcome',
      label: 'Welcome',
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
    },
    {
      id: 'theme',
      label: 'Theme',
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
    },
    {
      id: 'settings',
      label: 'Settings',
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
    },
  ]

  return (
    <div className="flex h-full">
      {/* Left: Vertical Tabs */}
      <aside className="w-48 border-r">
        <nav className="flex flex-col gap-1 p-2">
          {tabs.map((tab) => {
            const isActive = matchRoute({ to: tab.to })
            return (
              <Link
                key={tab.id}
                to={tab.to}
                params={{ workspaceSlug, projectId, eventId }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Right: Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
