/**
 * ProjectConfigDesignerPage Container
 *
 * Layout shell for the project config designer.
 * Navigation is handled via horizontal tabs in TopNavBar (see ProjectConfigDesignerLayout).
 */
import { Outlet } from '@tanstack/react-router'

/**
 * ProjectConfigDesignerPage component
 *
 * Renders the project config designer content area.
 * Horizontal tabs navigation is handled by TopNavBar in ProjectConfigDesignerLayout.
 */
export function ProjectConfigDesignerPage() {
  return (
    <main className="h-full overflow-auto">
      <Outlet />
    </main>
  )
}
