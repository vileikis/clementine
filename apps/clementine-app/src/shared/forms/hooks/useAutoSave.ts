/**
 * Hook: useAutoSave
 *
 * Provides debounced auto-save functionality for forms.
 * Automatically detects changed fields and triggers updates only when necessary.
 */

import { useCallback, useEffect, useRef } from 'react'
import { getChangedFields } from '../utils'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

interface UseAutoSaveOptions<TFormValues extends FieldValues, TOriginal> {
  /** React Hook Form instance */
  form: UseFormReturn<TFormValues>
  /** Original data to compare against */
  originalValues: TOriginal
  /** Callback to persist changes */
  onUpdate: (updates: Partial<TFormValues>) => Promise<void>
  /**
   * Fields to check for changes (e.g., ['title', 'description', 'config']).
   * If empty or undefined, compares all fields from both form and original values.
   */
  fieldsToCompare?: (keyof TFormValues)[]
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
}

interface UseAutoSaveResult {
  /** Trigger save manually (can be called on blur, change, or any event) */
  triggerSave: () => void
}

/**
 * Custom hook for debounced auto-save.
 * Can be triggered on blur, change, or any other event.
 *
 * @example
 * ```tsx
 * // Example 1: Save on blur (text inputs)
 * const { triggerSave } = useAutoSave({
 *   form,
 *   originalValues: data,
 *   onUpdate,
 *   fieldsToCompare: ['title', 'description'],
 * });
 *
 * return <form onBlur={triggerSave}>...</form>
 *
 * // Example 2: Save on change (toggle buttons)
 * const { triggerSave } = useAutoSave({
 *   form,
 *   originalValues: data,
 *   onUpdate,
 *   fieldsToCompare: ['enabled', 'visible'],
 * });
 *
 * useEffect(() => {
 *   if (!isInitialMount) triggerSave()
 * }, [formValues])
 * ```
 */
export function useAutoSave<TFormValues extends FieldValues, TOriginal>({
  form,
  originalValues,
  onUpdate,
  fieldsToCompare,
  debounceMs = 300,
}: UseAutoSaveOptions<TFormValues, TOriginal>): UseAutoSaveResult {
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced auto-save (can be triggered by any event)
  const triggerSave = useCallback(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the save
    debounceRef.current = setTimeout(async () => {
      const isValid = await form.trigger()
      if (!isValid) return

      const formValues = form.getValues()
      const updates = getChangedFields(
        formValues,
        originalValues as Record<string, unknown>,
        fieldsToCompare,
      )

      // Only call onUpdate if there are actual changes
      if (Object.keys(updates).length > 0) {
        await onUpdate(updates)
      }
    }, debounceMs)
  }, [form, originalValues, onUpdate, fieldsToCompare, debounceMs])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    triggerSave,
  }
}
