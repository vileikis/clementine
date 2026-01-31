/**
 * UnknownNode Components
 *
 * Fallback header and settings for unknown node types.
 * Provides a safe fallback for forward compatibility.
 */
import { AlertTriangle } from 'lucide-react'

export interface UnknownNodeProps {
  /** The unknown node type string */
  nodeType: string
}

/**
 * Unknown Node Header
 *
 * Shows a warning indicator with the unknown type.
 */
export function UnknownNodeHeader({ nodeType }: UnknownNodeProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Unknown Node
      </div>
      <div className="truncate text-sm text-muted-foreground">
        Type: {nodeType}
      </div>
    </div>
  )
}

/**
 * Unknown Node Settings
 *
 * Shows a warning message about the unrecognized node type.
 */
export function UnknownNodeSettings({ nodeType }: UnknownNodeProps) {
  return (
    <div className="border-t px-3 pb-4 pt-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This node type ({nodeType}) is not recognized. It may have been
          created by a newer version of the application or is not yet supported
          in the UI.
        </p>
      </div>
    </div>
  )
}
