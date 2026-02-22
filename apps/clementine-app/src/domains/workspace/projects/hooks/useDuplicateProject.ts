import { useMutation } from '@tanstack/react-query'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { duplicateProjectInputSchema } from '../schemas/project.schemas'
import type { WithFieldValue } from 'firebase/firestore'
import type { Project } from '../types'
import type { DuplicateProjectInput } from '../schemas/project.schemas'
import { generateDuplicateName } from '@/domains/experience/shared/lib/generate-duplicate-name'
import { firestore } from '@/integrations/firebase/client'

export interface DuplicateProjectResult {
  workspaceId: string
  projectId: string
  name: string
}

export function useDuplicateProject() {
  return useMutation<DuplicateProjectResult, Error, DuplicateProjectInput>({
    mutationFn: async (input) => {
      const validated = duplicateProjectInputSchema.parse(input)

      const projectsRef = collection(firestore, 'projects')

      return await runTransaction(firestore, async (transaction) => {
        const sourceRef = doc(projectsRef, validated.projectId)
        const sourceSnapshot = await transaction.get(sourceRef)

        if (!sourceSnapshot.exists()) {
          throw new Error('Source project not found')
        }

        const source = sourceSnapshot.data() as Project
        if (source.status === 'deleted') {
          throw new Error('Source project is deleted')
        }

        const newRef = doc(projectsRef)
        const name = generateDuplicateName(source.name)

        const newProject: WithFieldValue<Project> = {
          id: newRef.id,
          name,
          workspaceId: source.workspaceId,
          status: 'draft' as const,
          type: source.type,
          draftConfig: source.draftConfig
            ? structuredClone(source.draftConfig)
            : null,
          publishedConfig: null,
          exports: null,
          draftVersion: 1,
          publishedVersion: null,
          publishedAt: null,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        transaction.set(newRef, newProject)

        return {
          workspaceId: validated.workspaceId,
          projectId: newRef.id,
          name,
        }
      })
    },
    onSuccess: () => {},
    onError: (error) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'workspace/projects',
          action: 'duplicate-project',
        },
      })
    },
  })
}
