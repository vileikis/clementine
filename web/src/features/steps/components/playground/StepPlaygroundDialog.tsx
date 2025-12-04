"use client";

/**
 * StepPlaygroundDialog - Dialog wrapper for StepAIPlayground
 *
 * Provides a modal dialog container for testing AI transformations.
 * Uses shadcn/ui Dialog with max-w-4xl for comfortable side-by-side on desktop.
 *
 * @feature 019-ai-transform-playground
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepAIPlayground } from "./StepAIPlayground";
import type { AiTransformConfigSchema } from "../../schemas";

interface StepPlaygroundDialogProps {
  /** Step ID for the current ai-transform step */
  stepId: string;
  /** Current AI config from the step */
  config: AiTransformConfigSchema;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

export function StepPlaygroundDialog({
  stepId,
  config,
  open,
  onOpenChange,
}: StepPlaygroundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test AI Transform</DialogTitle>
          <DialogDescription>
            Test your AI transformation with a sample image
          </DialogDescription>
        </DialogHeader>
        <StepAIPlayground stepId={stepId} config={config} />
      </DialogContent>
    </Dialog>
  );
}
