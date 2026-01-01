// ProjectEventItem component
// Individual project event row with basic display

import type { ProjectEvent } from '../types/project-event.types'

export interface ProjectEventItemProps {
  /** Project event to display */
  event: ProjectEvent

  /** Project ID (for navigation/mutations) */
  projectId: string

  /** Whether this event is currently active */
  isActive: boolean
}

/**
 * ProjectEventItem component
 * Displays a single project event in the list
 *
 * @example
 * ```tsx
 * <ProjectEventItem
 *   event={event}
 *   projectId={projectId}
 *   isActive={isActive}
 * />
 * ```
 */
export function ProjectEventItem({ event, projectId, isActive }: ProjectEventItemProps) {
  return (
    <div
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      role="listitem"
    >
      {/* Event name and status */}
      <div className="flex flex-col gap-1">
        <h4 className="font-medium">{event.name}</h4>
        {isActive && (
          <span className="text-xs text-green-600 font-medium">● Active</span>
        )}
      </div>

      {/* Placeholder for future controls (activation switch, context menu) */}
      <div className="flex items-center gap-2">
        {/* Activation switch and context menu will be added in later phases */}
      </div>
    </div>
  )
}
