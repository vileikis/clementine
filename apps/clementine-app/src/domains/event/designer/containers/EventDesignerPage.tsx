/**
 * EventDesignerPage Container
 *
 * Layout shell for the event designer with vertical tabs navigation.
 * Provides a 2-column layout: left sidebar with tabs, right content area with outlet.
 */
import { Outlet } from '@tanstack/react-router'
import {
  EventDesignerSidebar,
  type SidebarItem,
} from '../components/EventDesignerSidebar'

const sidebarItems: SidebarItem[] = [
  {
    type: 'link',
    id: 'welcome',
    label: 'Welcome',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
  },
  {
    type: 'link',
    id: 'theme',
    label: 'Theme',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
  },
  {
    type: 'link',
    id: 'settings',
    label: 'Settings',
    to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
  },
]

/**
 * EventDesignerPage component
 *
 * Renders the event designer interface with:
 * - Left sidebar: Vertical tabs for Welcome, Theme, Settings
 * - Right content area: Active tab content (rendered via Outlet)
 */
export function EventDesignerPage() {
  return (
    <div className="flex h-full">
      <EventDesignerSidebar items={sidebarItems} />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
