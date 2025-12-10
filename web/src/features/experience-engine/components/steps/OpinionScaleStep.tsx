"use client";

// ============================================================================
// OpinionScaleStep Renderer
// ============================================================================
// Renders opinion scale step for Experience Engine.
// Numeric scale selection with min/max labels.

import { StepLayout, ActionButton, ScaleButton } from "@/components/step-primitives";
import { useEventTheme } from "@/features/theming";
import type { StepOpinionScale } from "@/features/steps/types";
import type { StepRendererProps } from "../../types";

type OpinionScaleStepProps = StepRendererProps<StepOpinionScale>;

export function OpinionScaleStep({
  step,
  currentValue,
  isInteractive,
  onChange,
  onCtaClick,
}: OpinionScaleStepProps) {
  const { theme } = useEventTheme();
  const { scaleMin, scaleMax, minLabel, maxLabel } = step.config;

  // Extract current number value
  const selectedValue =
    currentValue?.type === "number" ? currentValue.value : undefined;

  // Generate scale values
  const scaleValues: number[] = [];
  for (let i = scaleMin; i <= scaleMax; i++) {
    scaleValues.push(i);
  }

  const handleClick = (value: number) => {
    if (!isInteractive) return;
    onChange({ type: "number", value });
  };

  return (
    <StepLayout
      mediaUrl={step.mediaUrl}
      mediaType={step.mediaType}
      action={
        step.ctaLabel && <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
      }
    >
      {step.title && <h2 className="text-2xl font-bold mb-2">{step.title}</h2>}
      {step.description && (
        <p className="text-sm opacity-80 mb-4">{step.description}</p>
      )}

      {/* Scale buttons - wrap with center alignment */}
      <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
        {scaleValues.map((value) => (
          <ScaleButton
            key={value}
            value={value}
            selected={selectedValue === value}
            onClick={() => handleClick(value)}
          />
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
    </StepLayout>
  );
}
