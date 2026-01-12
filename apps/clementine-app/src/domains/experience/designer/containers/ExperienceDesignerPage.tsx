/**
 * ExperienceDesignerPage Container
 *
 * Main content area for the experience designer.
 * Placeholder for future step editing functionality (E2).
 */
import { Outlet } from '@tanstack/react-router'

import { Card } from '@/ui-kit/ui/card'

/**
 * Experience designer content page
 *
 * Currently shows placeholder content.
 * Will contain step editor in E2.
 */
export function ExperienceDesignerPage() {
  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Placeholder content for E2 */}
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Step editor coming in E2. This is a placeholder for the experience
          editor interface.
        </p>
      </Card>

      {/* Child routes (if any) */}
      <Outlet />
    </div>
  )
}
