/**
 * useDropboxExport
 *
 * Reads project Dropbox export config and provides a toggle callback.
 * Export config is read from the project document (available via useProject).
 */
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useToggleDropboxExport } from './useToggleDropboxExport'
import type { Project } from '@clementine/shared'

interface DropboxExportState {
  /** Whether Dropbox export is enabled for this project */
  isEnabled: boolean
  /** Toggle export on/off */
  toggle: () => void
  /** Whether a toggle mutation is in progress */
  isToggling: boolean
}

/**
 * Hook for reading and toggling Dropbox export on a project
 *
 * @param project - Project data from useProject hook
 * @returns Export state and toggle callback
 */
export function useDropboxExport(
  project: Project | null | undefined,
): DropboxExportState {
  const mutation = useToggleDropboxExport()

  const isEnabled = project?.exports?.dropbox?.enabled === true

  const toggle = useCallback(() => {
    if (!project) return

    const newEnabled = !isEnabled

    mutation.mutate(
      { projectId: project.id, enabled: newEnabled },
      {
        onSuccess: () => {
          toast.success(
            newEnabled ? 'Dropbox export enabled' : 'Dropbox export disabled',
          )
        },
        onError: () => {
          toast.error('Failed to update export setting')
        },
      },
    )
  }, [project, isEnabled, mutation])

  return {
    isEnabled,
    toggle,
    isToggling: mutation.isPending,
  }
}
