"use client";

/**
 * Hook: useKeyboardShortcuts
 *
 * Provides keyboard shortcuts for the journey editor:
 * - ArrowUp/ArrowDown: Navigate between steps
 * - Delete/Backspace: Delete selected step (with confirmation)
 * - Cmd/Ctrl+D: Duplicate selected step
 *
 * Note: Cmd+S is NOT implemented because forms auto-save on blur.
 */

import { useEffect, useCallback, useRef } from "react";

interface UseKeyboardShortcutsOptions {
  /** Array of step IDs in order */
  stepIds: string[];
  /** Currently selected step ID */
  selectedStepId: string | null;
  /** Callback to change selection */
  onSelectStep: (stepId: string) => void;
  /** Callback to delete selected step */
  onDeleteStep: () => void;
  /** Callback to duplicate selected step */
  onDuplicateStep: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  stepIds,
  selectedStepId,
  onSelectStep,
  onDeleteStep,
  onDuplicateStep,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  // Track if an input element is focused to avoid conflicts
  const isInputFocused = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled or no steps
      if (!enabled || stepIds.length === 0) return;

      // Check if an input/textarea is focused
      const activeElement = document.activeElement;
      const isEditing =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      // Skip navigation shortcuts if editing text
      if (isEditing) {
        // Only allow Cmd/Ctrl shortcuts while editing
        if (!(event.metaKey || event.ctrlKey)) return;
      }

      const currentIndex = selectedStepId
        ? stepIds.indexOf(selectedStepId)
        : -1;

      switch (event.key) {
        case "ArrowUp":
          // Navigate to previous step
          if (!isEditing && currentIndex > 0) {
            event.preventDefault();
            onSelectStep(stepIds[currentIndex - 1]);
          }
          break;

        case "ArrowDown":
          // Navigate to next step
          if (!isEditing && currentIndex < stepIds.length - 1) {
            event.preventDefault();
            onSelectStep(stepIds[currentIndex + 1]);
          }
          break;

        case "Delete":
        case "Backspace":
          // Delete selected step (only if not editing)
          if (!isEditing && selectedStepId) {
            event.preventDefault();
            onDeleteStep();
          }
          break;

        case "d":
        case "D":
          // Cmd/Ctrl+D: Duplicate step
          if ((event.metaKey || event.ctrlKey) && selectedStepId) {
            event.preventDefault();
            onDuplicateStep();
          }
          break;
      }
    },
    [enabled, stepIds, selectedStepId, onSelectStep, onDeleteStep, onDuplicateStep]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Track focus state for input elements
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      isInputFocused.current =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement;
    };

    const handleFocusOut = () => {
      isInputFocused.current = false;
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);
}
