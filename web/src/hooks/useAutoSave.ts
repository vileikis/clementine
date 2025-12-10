"use client";

/**
 * Hook: useAutoSave
 *
 * Provides debounced auto-save functionality for forms.
 * Automatically detects changed fields and triggers updates only when necessary.
 */

import { useRef, useCallback, useEffect } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import { getChangedFields } from "@/lib/utils/form-diff";

interface UseAutoSaveOptions<TFormValues extends FieldValues, TOriginal> {
  /** React Hook Form instance */
  form: UseFormReturn<TFormValues>;
  /** Original data to compare against */
  originalValues: TOriginal;
  /** Callback to persist changes */
  onUpdate: (updates: Partial<TFormValues>) => Promise<void>;
  /** Fields to check for changes (e.g., ['title', 'description', 'config']) */
  fieldsToCompare: (keyof TFormValues)[];
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
}

interface UseAutoSaveResult {
  /** Blur handler to attach to the form */
  handleBlur: () => Promise<void>;
}

/**
 * Custom hook for debounced auto-save on form blur.
 *
 * @example
 * ```tsx
 * const { handleBlur } = useAutoSave({
 *   form,
 *   originalValues: data,
 *   onUpdate,
 *   fieldsToCompare: ['title', 'description', 'mediaUrl', 'ctaLabel', 'config'],
 * });
 *
 * return (
 *   <form onBlur={handleBlur}>
 *     ...
 *   </form>
 * );
 * ```
 */
export function useAutoSave<TFormValues extends FieldValues, TOriginal>({
  form,
  originalValues,
  onUpdate,
  fieldsToCompare,
  debounceMs = 300,
}: UseAutoSaveOptions<TFormValues, TOriginal>): UseAutoSaveResult {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save on blur
  const handleBlur = useCallback(async () => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the save
    debounceRef.current = setTimeout(async () => {
      const isValid = await form.trigger();
      if (!isValid) return;

      const formValues = form.getValues();
      const updates = getChangedFields(
        formValues,
        originalValues as Record<string, unknown>,
        fieldsToCompare
      );

      // Only call onUpdate if there are actual changes
      if (Object.keys(updates).length > 0) {
        await onUpdate(updates);
      }
    }, debounceMs);
  }, [form, originalValues, onUpdate, fieldsToCompare, debounceMs]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { handleBlur };
}
