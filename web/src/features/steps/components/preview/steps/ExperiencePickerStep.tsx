"use client";

/**
 * Preview: ExperiencePickerStep
 *
 * Read-only preview for Experience Picker step type.
 * Displays title, description, and experience options in the configured layout.
 * Resolves display data (name, previewMediaUrl) from experiences at runtime.
 */

import { useMemo } from "react";
import { StepLayout, ActionButton, OptionButton } from "@/components/step-primitives";
import { useEventTheme } from "@/components/providers/EventThemeProvider";
import { AlertCircle, ImageIcon } from "lucide-react";
import type { StepExperiencePicker } from "@/features/steps/types";
import type { Experience } from "@/features/experiences/types";

interface ExperiencePickerStepProps {
  step: StepExperiencePicker;
  experiences: Experience[];
  /** Enable interactive selection (playback mode) */
  isInteractive?: boolean;
  /** Currently selected experience ID */
  selectedExperienceId?: string;
  /** Callback when selection changes */
  onValueChange?: (experienceId: string) => void;
  /** Callback when CTA button is clicked */
  onCtaClick?: () => void;
}

interface ResolvedOption {
  id: string;
  name: string;
  imageUrl: string | null;
  missing: boolean;
}

export function ExperiencePickerStep({
  step,
  experiences,
  isInteractive = false,
  selectedExperienceId,
  onValueChange,
  onCtaClick,
}: ExperiencePickerStepProps) {
  const layout = step.config?.layout ?? "grid";

  const handleSelect = (experienceId: string) => {
    if (isInteractive) {
      onValueChange?.(experienceId);
    }
  };

  // Resolve experience data from IDs
  const resolvedOptions = useMemo(() => {
    const experienceMap = new Map((experiences ?? []).map((e) => [e.id, e]));
    const ids = step.config?.experienceIds ?? [];

    return ids.map((id): ResolvedOption => {
      const experience = experienceMap.get(id);
      if (experience) {
        return {
          id,
          name: experience.name,
          imageUrl: experience.previewMediaUrl ?? null,
          missing: false,
        };
      }
      return {
        id,
        name: "Missing Experience",
        imageUrl: null,
        missing: true,
      };
    });
  }, [step.config?.experienceIds, experiences]);

  const hasMissingExperiences = resolvedOptions.some((o) => o.missing);

  return (
    <StepLayout mediaUrl={step.mediaUrl}>
      <div className="flex-1">
        {step.title && (
          <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        )}
        {step.description && (
          <p className="text-sm opacity-80 mb-4">{step.description}</p>
        )}

        {hasMissingExperiences && (
          <div className="flex items-center gap-2 text-xs text-destructive mb-3">
            <AlertCircle className="h-3 w-3" />
            <span>Some experiences are missing</span>
          </div>
        )}

        {resolvedOptions.length === 0 ? (
          <div className="text-center py-4 opacity-60">
            <p className="text-sm">No experiences selected</p>
          </div>
        ) : (
          <OptionsLayout
            layout={layout}
            options={resolvedOptions}
            selectedId={selectedExperienceId}
            onSelect={handleSelect}
          />
        )}
      </div>

      {step.ctaLabel && (
        <div className="mt-auto pt-4">
          <ActionButton onClick={onCtaClick}>{step.ctaLabel}</ActionButton>
        </div>
      )}
    </StepLayout>
  );
}

interface OptionsLayoutProps {
  layout: "grid" | "list" | "carousel";
  options: ResolvedOption[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

function OptionsLayout({ layout, options, selectedId, onSelect }: OptionsLayoutProps) {
  const { theme } = useEventTheme();

  switch (layout) {
    case "grid":
      return (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <GridOption
              key={option.id}
              option={option}
              theme={theme}
              selected={selectedId === option.id}
              onClick={() => onSelect?.(option.id)}
            />
          ))}
        </div>
      );

    case "list":
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <OptionButton
              key={option.id}
              selected={selectedId === option.id}
              onClick={() => onSelect?.(option.id)}
            >
              <span className={option.missing ? "text-destructive" : ""}>
                {option.name}
              </span>
            </OptionButton>
          ))}
        </div>
      );

    case "carousel":
      return (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {options.map((option) => (
            <CarouselOption
              key={option.id}
              option={option}
              theme={theme}
              selected={selectedId === option.id}
              onClick={() => onSelect?.(option.id)}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
}

interface OptionProps {
  option: ResolvedOption;
  theme: ReturnType<typeof useEventTheme>["theme"];
  selected?: boolean;
  onClick?: () => void;
}

function GridOption({ option, theme, selected, onClick }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 border-2 rounded-lg transition-colors aspect-square isolate ${
        option.missing ? "border-destructive/40" : ""
      } ${selected ? "ring-2 ring-offset-2" : ""}`}
      style={{
        borderColor: option.missing ? undefined : theme.text.color + "40",
        color: theme.text.color,
        ...(selected ? { borderColor: theme.button.backgroundColor ?? theme.text.color } : {}),
      }}
    >
      {option.imageUrl ? (
        <div className="flex-1 w-full rounded overflow-hidden mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`flex-1 w-full rounded flex items-center justify-center mb-1 ${
            option.missing ? "bg-destructive/10" : ""
          }`}
          style={{
            backgroundColor: option.missing ? undefined : theme.text.color + "10",
          }}
        >
          {option.missing ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <ImageIcon className="h-5 w-5 opacity-40" />
          )}
        </div>
      )}
      <span
        className={`text-xs font-medium truncate w-full text-center ${
          option.missing ? "text-destructive" : ""
        }`}
      >
        {option.name}
      </span>
    </button>
  );
}

function CarouselOption({ option, theme, selected, onClick }: OptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center p-2 border-2 rounded-lg transition-colors shrink-0 w-24 isolate ${
        option.missing ? "border-destructive/40" : ""
      } ${selected ? "ring-2 ring-offset-2" : ""}`}
      style={{
        borderColor: option.missing ? undefined : theme.text.color + "40",
        color: theme.text.color,
        ...(selected ? { borderColor: theme.button.backgroundColor ?? theme.text.color } : {}),
      }}
    >
      {option.imageUrl ? (
        <div className="w-full h-16 rounded overflow-hidden mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.imageUrl}
            alt={option.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`w-full h-16 rounded flex items-center justify-center mb-1 ${
            option.missing ? "bg-destructive/10" : ""
          }`}
          style={{
            backgroundColor: option.missing ? undefined : theme.text.color + "10",
          }}
        >
          {option.missing ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <ImageIcon className="h-5 w-5 opacity-40" />
          )}
        </div>
      )}
      <span
        className={`text-xs font-medium truncate w-full text-center ${
          option.missing ? "text-destructive" : ""
        }`}
      >
        {option.name}
      </span>
    </button>
  );
}
