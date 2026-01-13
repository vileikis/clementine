/**
 * useStepSelection Hook
 *
 * Manages step selection state synced with URL search params.
 * Enables deep linking to specific steps via ?step={stepId}.
 */
import { useCallback, useMemo } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'

import type { Step } from '../../steps/registry/step-registry'

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
  const router = useRouter()
  const routerState = useRouterState()

  // Get current step ID from URL search params
  const selectedStepId = useMemo(() => {
    const searchParams = new URLSearchParams(routerState.location.searchStr)
    return searchParams.get('step')
  }, [routerState.location.searchStr])

  // Find the selected step from the list
  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null
    return steps.find((s) => s.id === selectedStepId) ?? null
  }, [steps, selectedStepId])

  // Update URL with new step selection
  const selectStep = useCallback(
    (stepId: string) => {
      const searchParams = new URLSearchParams(routerState.location.searchStr)
      searchParams.set('step', stepId)
      const newSearch = searchParams.toString()

      router.history.replace(`${routerState.location.pathname}?${newSearch}`)
    },
    [
      router.history,
      routerState.location.pathname,
      routerState.location.searchStr,
    ],
  )

  // Clear step selection
  const clearSelection = useCallback(() => {
    const searchParams = new URLSearchParams(routerState.location.searchStr)
    searchParams.delete('step')
    const newSearch = searchParams.toString()

    const newPath = newSearch
      ? `${routerState.location.pathname}?${newSearch}`
      : routerState.location.pathname

    router.history.replace(newPath)
  }, [
    router.history,
    routerState.location.pathname,
    routerState.location.searchStr,
  ])

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
