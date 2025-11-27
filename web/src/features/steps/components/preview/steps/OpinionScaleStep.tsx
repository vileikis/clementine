"use client";

/**
 * Preview: OpinionScaleStep
 *
 * Read-only preview for Opinion Scale step type.
 * Displays title, description, scale buttons, min/max labels, and CTA button.
 */

import { StepLayout, ActionButton, ScaleButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import type { StepOpinionScale } from "@/features/steps/types";

interface OpinionScaleStepProps {
  step: StepOpinionScale;
}

export function OpinionScaleStep({ step }: OpinionScaleStepProps) {
  const { theme } = useEventTheme();
  const { scaleMin, scaleMax, minLabel, maxLabel } = step.config;

  // Generate scale values
  const scaleValues: number[] = [];
  for (let i = scaleMin; i <= scaleMax; i++) {
    scaleValues.push(i);
  }

  return (
    <StepLayout mediaUrl={step.mediaUrl} mediaType={step.mediaType}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {/* Scale buttons */}
        <div className="flex flex-wrap justify-between gap-2">
          {scaleValues.map((value) => (
            <ScaleButton key={value} value={value} />
          ))}
        </div>

        {/* Min/Max labels */}
        {(minLabel || maxLabel) && (
          <div
            className="flex justify-between mt-2 text-xs opacity-70"
            style={{ color: theme.text.color }}
          >
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}
