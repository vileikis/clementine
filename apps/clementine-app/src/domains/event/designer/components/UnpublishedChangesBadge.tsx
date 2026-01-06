import { useMemo } from 'react'

interface UnpublishedChangesBadgeProps {
  draftVersion: number | null
  publishedVersion: number | null
}

/**
 * Badge indicating unpublished changes in the event designer.
 *
 * Displays a yellow badge when draft version > published version,
 * prompting user to publish their changes.
 *
 * Logic:
 * - If never published (publishedVersion === null), show badge
 * - If draft version > published version, show badge
 * - Otherwise, hide badge
 *
 * @param draftVersion - Current draft version number
 * @param publishedVersion - Last published version number
 */
export function UnpublishedChangesBadge({
  draftVersion,
  publishedVersion,
}: UnpublishedChangesBadgeProps) {
  const hasUnpublishedChanges = useMemo(() => {
    if (publishedVersion === null) return true // Never published
    return draftVersion !== null && draftVersion > publishedVersion
  }, [draftVersion, publishedVersion])

  if (!hasUnpublishedChanges) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
      <div className="h-2 w-2 rounded-full bg-yellow-500" />
      New changes
    </div>
  )
}
