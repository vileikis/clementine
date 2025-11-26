"use client";

/**
 * Hook: useSelectedStep
 *
 * Manages selected step state with URL query param synchronization.
 * Enables deep linking to specific steps.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Step } from "@/features/steps/types";

interface UseSelectedStepResult {
  selectedStepId: string | null;
  selectedStep: Step | null;
  setSelectedStepId: (stepId: string | null) => void;
}

/**
 * Manages step selection with URL sync.
 * - Reads stepId from URL query params
 * - Auto-selects first step if no stepId in URL
 * - Updates URL when selection changes
 */
export function useSelectedStep(steps: Step[]): UseSelectedStepResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get stepId from URL, auto-select first step if not set
  const selectedStepId = useMemo(() => {
    const urlStepId = searchParams.get("stepId");

    // If URL has a stepId and it exists in steps, use it
    if (urlStepId && steps.some((s) => s.id === urlStepId)) {
      return urlStepId;
    }

    // Otherwise, auto-select first step
    return steps.length > 0 ? steps[0].id : null;
  }, [searchParams, steps]);

  // Get the selected step object
  const selectedStep = useMemo(() => {
    if (!selectedStepId) return null;
    return steps.find((s) => s.id === selectedStepId) ?? null;
  }, [selectedStepId, steps]);

  // Update URL when selection changes
  const setSelectedStepId = useCallback(
    (stepId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (stepId) {
        params.set("stepId", stepId);
      } else {
        params.delete("stepId");
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(newUrl, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return {
    selectedStepId,
    selectedStep,
    setSelectedStepId,
  };
}
