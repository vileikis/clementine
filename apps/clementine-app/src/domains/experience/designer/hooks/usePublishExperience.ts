/**
 * usePublishExperience Hook
 *
 * Validates and publishes an experience by copying draft to published.
 * Includes client-side validation for:
 * - At least one step required
 * - All step configs valid per their schemas
 * - Step types allowed for the experience profile
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'

import { experienceKeys } from '../../shared/queries/experience.query'
import { stepRegistry } from '../../steps/registry/step-registry'
import { getStepTypesForProfile } from '../../steps/registry/step-utils'
import type { UpdateData } from 'firebase/firestore'
import type { Experience } from '../../shared/schemas'
import type { Step, StepType } from '../../steps/registry/step-registry'
import { firestore } from '@/integrations/firebase/client'

/**
 * Validation error for publish
 */
export interface PublishValidationError {
  /** Field path that has the error */
  field: string
  /** Human-readable error message */
  message: string
  /** Step ID if error is step-specific */
  stepId?: string
}

/**
 * Result of publish validation
 */
export interface PublishValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Array of validation errors */
  errors: PublishValidationError[]
}

/**
 * Result of successful publish
 */
export interface PublishExperienceResult {
  /** Experience ID that was published */
  experienceId: string
  /** Workspace ID for cache invalidation */
  workspaceId: string
  /** Timestamp of publish */
  publishedAt: number
}

/**
 * Validates an experience for publishing
 *
 * Checks:
 * 1. At least one step exists
 * 2. All step configs are valid per their schemas
 * 3. All step types are allowed for the experience profile
 *
 * @param experience - Experience to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```tsx
 * const result = validateForPublish(experience)
 * if (!result.valid) {
 *   // Show result.errors to user
 * }
 * ```
 */
export function validateForPublish(
  experience: Experience,
): PublishValidationResult {
  const errors: PublishValidationError[] = []

  // Rule 1: At least one step
  if (!experience.draft.steps || experience.draft.steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'At least one step is required to publish',
    })
    return { valid: false, errors }
  }

  // Rule 2: All steps have valid config
  for (const step of experience.draft.steps) {
    const definition = stepRegistry[step.type as StepType]
    if (!definition) {
      errors.push({
        field: 'steps',
        stepId: step.id,
        message: `Unknown step type: ${step.type}`,
      })
      continue
    }

    const result = definition.configSchema.safeParse(step.config)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: `steps.${step.id}.config.${issue.path.join('.')}`,
          stepId: step.id,
          message: issue.message,
        })
      }
    }
  }

  // Rule 3: Profile constraints
  const allowedTypes = getStepTypesForProfile(experience.profile)
  for (const step of experience.draft.steps) {
    if (!allowedTypes.includes(step.type as StepType)) {
      errors.push({
        field: 'steps',
        stepId: step.id,
        message: `Step type "${step.type}" is not allowed for ${experience.profile} profile`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get a human-readable label for a step
 */
function getStepLabel(step: Step): string {
  const definition = stepRegistry[step.type]
  return definition?.label ?? step.type
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: PublishValidationError[],
  steps: Step[],
): string[] {
  return errors.map((error) => {
    if (error.stepId) {
      const step = steps.find((s) => s.id === error.stepId)
      const stepLabel = step ? getStepLabel(step) : 'Unknown step'
      const stepIndex = step ? steps.indexOf(step) + 1 : '?'
      return `Step ${stepIndex} (${stepLabel}): ${error.message}`
    }
    return error.message
  })
}

/**
 * Input for publish mutation
 */
export interface PublishExperienceInput {
  /** Workspace containing the experience */
  workspaceId: string
  /** Experience to publish */
  experience: Experience
}

/**
 * Hook for publishing an experience
 *
 * Validates the experience before publishing and copies draft to published.
 * Returns validation errors if validation fails.
 *
 * @returns TanStack Mutation result with validation support
 *
 * @example
 * ```tsx
 * function PublishButton({ experience, workspaceId }) {
 *   const publishExperience = usePublishExperience()
 *
 *   const handlePublish = async () => {
 *     const result = await publishExperience.mutateAsync({
 *       workspaceId,
 *       experience,
 *     })
 *
 *     if ('errors' in result && result.errors.length > 0) {
 *       // Handle validation errors
 *     }
 *   }
 *
 *   return (
 *     <Button onClick={handlePublish} disabled={publishExperience.isPending}>
 *       Publish
 *     </Button>
 *   )
 * }
 * ```
 */
export function usePublishExperience() {
  const queryClient = useQueryClient()

  return useMutation<
    PublishExperienceResult | PublishValidationResult,
    Error,
    PublishExperienceInput
  >({
    mutationFn: async ({ workspaceId, experience }) => {
      // Validate before publish
      const validation = validateForPublish(experience)
      if (!validation.valid) {
        return validation
      }

      // Publish: copy draft to published
      const experienceRef = doc(
        firestore,
        `workspaces/${workspaceId}/experiences/${experience.id}`,
      )

      await runTransaction(firestore, async (transaction) => {
        const experienceDoc = await transaction.get(experienceRef)

        if (!experienceDoc.exists()) {
          throw new Error(`Experience ${experience.id} not found`)
        }

        const currentExperience = experienceDoc.data() as Experience

        if (!currentExperience.draft) {
          throw new Error('Cannot publish: no draft configuration exists')
        }

        // Sync publishedVersion with current draftVersion
        transaction.update(experienceRef, {
          published: currentExperience.draft,
          publishedVersion: currentExperience.draftVersion,
          publishedAt: serverTimestamp(),
          publishedBy: null, // TODO: Add current user ID when auth is integrated
          updatedAt: serverTimestamp(),
        } as UpdateData<Experience>)
      })

      return {
        experienceId: experience.id,
        workspaceId,
        publishedAt: Date.now(),
      }
    },

    onSuccess: (result, { workspaceId, experience }) => {
      // Only invalidate if publish succeeded (not validation errors)
      if ('experienceId' in result) {
        queryClient.invalidateQueries({
          queryKey: experienceKeys.detail(workspaceId, experience.id),
        })
      }
    },

    onError: (error, { workspaceId, experience }) => {
      Sentry.captureException(error, {
        tags: {
          domain: 'experience/designer',
          action: 'publish-experience',
        },
        extra: {
          errorType: 'experience-publish-failure',
          workspaceId,
          experienceId: experience.id,
        },
      })
    },
  })
}

/**
 * Type guard to check if result is a validation error
 */
export function isValidationError(
  result: PublishExperienceResult | PublishValidationResult,
): result is PublishValidationResult {
  return 'errors' in result && Array.isArray(result.errors)
}

/**
 * Type guard to check if result is a successful publish
 */
export function isPublishSuccess(
  result: PublishExperienceResult | PublishValidationResult,
): result is PublishExperienceResult {
  return 'experienceId' in result
}
