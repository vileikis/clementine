/**
 * useStepSelection Hook
 *
 * Manages step selection state synced with URL search params.
 * Enables deep linking to specific steps via ?step={stepId}.
 */
import { useCallback, useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import type { Step } from '../../steps/registry/step-registry'

// Get typed route API for the Collect tab route
const routeApi = getRouteApi(
  '/workspace/$workspaceSlug/experiences/$experienceId/collect',
)

/**
 * Search params schema for experience designer
 */
export interface ExperienceDesignerSearch {
  step?: string
}

/**
 * Hook for managing step selection with URL sync
 *
 * Provides selected step and selection handlers that update the URL.
 * This enables deep linking to specific steps and browser history navigation.
 *
 * Uses TanStack Router's native navigate() for optimized URL updates
 * that integrate properly with React's concurrent features.
 *
 * @param steps - Array of steps to select from
 * @returns Selection state and handlers
 *
 * @example
 * ```tsx
 * const { selectedStep, selectedStepId, selectStep, clearSelection } = useStepSelection(steps)
 *
 * // Select a step
 * selectStep(step.id)
 *
 * // Clear selection
 * clearSelection()
 *
 * // Access selected step
 * if (selectedStep) {
 *   // Show preview/config
 * }
 * ```
 */
export function useStepSelection(steps: Step[]) {
  // Use typed route API for proper search params handling
  const navigate = routeApi.useNavigate()
  const search = routeApi.useSearch()

  // Get current step ID from search params
  const selectedStepId = search?.step ?? null

  // Find the selected step from the list
  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null
    return steps.find((s) => s.id === selectedStepId) ?? null
  }, [steps, selectedStepId])

  // Update URL with new step selection using TanStack Router's navigate
  // Uses functional update to avoid stale closure issues
  const selectStep = useCallback(
    (stepId: string) => {
      navigate({
        search: (prev) => ({ ...prev, step: stepId }),
        replace: true,
      })
    },
    [navigate],
  )

  // Clear step selection
  const clearSelection = useCallback(() => {
    navigate({
      search: (prev) => {
        const { step: _, ...rest } = prev
        return rest
      },
      replace: true,
    })
  }, [navigate])

  return {
    /** Currently selected step, or null if none */
    selectedStep,
    /** ID of selected step, or null */
    selectedStepId,
    /** Select a step by ID (updates URL) */
    selectStep,
    /** Clear selection (removes step param from URL) */
    clearSelection,
  }
}
