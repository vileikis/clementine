/**
 * EventDesignerPage Container
 *
 * Layout shell for the event designer.
 * Navigation is handled via horizontal tabs in TopNavBar (see EventDesignerLayout).
 */
import { Outlet } from '@tanstack/react-router'

/**
 * EventDesignerPage component
 *
 * Renders the event designer content area.
 * Horizontal tabs navigation is handled by TopNavBar in EventDesignerLayout.
 */
export function EventDesignerPage() {
  return (
    <main className="h-full overflow-auto">
      <Outlet />
    </main>
  )
}
