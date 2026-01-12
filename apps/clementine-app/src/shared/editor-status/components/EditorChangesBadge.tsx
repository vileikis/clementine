/**
 * EditorChangesBadge Component
 *
 * Badge indicating unpublished changes in an editor.
 * Displays when draft version is ahead of published version.
 */
import { useMemo } from 'react'

import type { VersionInfo } from '../types'

interface EditorChangesBadgeProps extends VersionInfo {
  /** Optional custom label (defaults to "New changes") */
  label?: string
}

/**
 * Badge showing unpublished changes status
 *
 * Logic:
 * - If never published (publishedVersion === null), show badge
 * - If draft version > published version, show badge
 * - Otherwise, hide badge
 *
 * @example
 * ```tsx
 * <EditorChangesBadge
 *   draftVersion={event.draftVersion}
 *   publishedVersion={event.publishedVersion}
 * />
 * ```
 */
export function EditorChangesBadge({
  draftVersion,
  publishedVersion,
  label = 'New changes',
}: EditorChangesBadgeProps) {
  const hasUnpublishedChanges = useMemo(() => {
    if (publishedVersion === null) return true // Never published
    return draftVersion !== null && draftVersion > publishedVersion
  }, [draftVersion, publishedVersion])

  if (!hasUnpublishedChanges) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
      <div className="h-2 w-2 rounded-full bg-yellow-500" />
      {label}
    </div>
  )
}
