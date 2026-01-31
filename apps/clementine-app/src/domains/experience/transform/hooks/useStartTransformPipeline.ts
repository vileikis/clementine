import { useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import * as Sentry from '@sentry/tanstackstart-react'
import { functions } from '@/integrations/firebase/client'

export interface StartTransformParams {
  projectId: string
  sessionId: string
}

interface StartTransformResponse {
  success: boolean
  jobId: string
  message: string
}

/**
 * Hook for triggering transform pipeline via Firebase Callable
 *
 * Returns an async function that triggers the transform pipeline.
 * Awaits the response to ensure the job was created successfully.
 * Logs to Sentry on error - consumer handles UI feedback.
 *
 * @example
 * ```tsx
 * const startTransformPipeline = useStartTransformPipeline()
 *
 * const success = await startTransformPipeline({
 *   projectId: project.id,
 *   sessionId,
 * })
 * if (!success) {
 *   toast.error('Failed to start processing')
 *   return
 * }
 * ```
 */
export function useStartTransformPipeline() {
  return useCallback(async (params: StartTransformParams): Promise<boolean> => {
    const startTransform = httpsCallable<
      StartTransformParams,
      StartTransformResponse
    >(functions, 'startTransformPipelineV2')

    try {
      await startTransform(params)
      return true
    } catch (error) {
      console.error('Failed to trigger transform pipeline:', error)
      Sentry.captureException(error, {
        tags: {
          domain: 'experience',
          action: 'start-transform-pipeline',
        },
        extra: {
          projectId: params.projectId,
          sessionId: params.sessionId,
        },
      })
      return false
    }
  }, [])
}
