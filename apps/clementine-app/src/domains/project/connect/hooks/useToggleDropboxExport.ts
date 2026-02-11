/**
 * useToggleDropboxExport
 *
 * Client-side mutation hook for toggling Dropbox export on a project.
 * Uses Firestore client SDK (updateDoc) with security enforced by Firestore rules.
 */
import { useMutation } from '@tanstack/react-query'
import { doc, updateDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'

interface ToggleDropboxExportInput {
  projectId: string
  enabled: boolean
}

export function useToggleDropboxExport() {
  return useMutation({
    mutationFn: async ({ projectId, enabled }: ToggleDropboxExportInput) => {
      const auth = getAuth()
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const projectRef = doc(firestore, 'projects', projectId)

      const now = Date.now()

      await updateDoc(projectRef, {
        'exports.dropbox.enabled': enabled,
        'exports.dropbox.enabledBy': userId,
        'exports.dropbox.enabledAt': now,
        updatedAt: now,
      })
    },

    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'project/connect',
          action: 'toggle-dropbox-export',
        },
      })
    },
  })
}
