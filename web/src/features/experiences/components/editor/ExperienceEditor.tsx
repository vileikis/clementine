"use client";

/**
 * Component: ExperienceEditor
 *
 * Main 3-panel layout for the experience editor.
 * - Left: Step list with drag-and-drop reordering
 * - Middle: Live preview panel with default theme
 * - Right: Step configuration editor
 *
 * Responsive: Stacks vertically on mobile, side-by-side on desktop.
 *
 * Keyboard shortcuts:
 * - ArrowUp/ArrowDown: Navigate between steps
 * - Delete/Backspace: Delete selected step (with confirmation)
 * - Cmd/Ctrl+D: Duplicate selected step
 */

import { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ExperienceEditorHeader } from "./ExperienceEditorHeader";
import { StepList } from "./StepList";
import { StepEditor } from "./StepEditor";
import {
  PreviewRuntime,
  ViewSwitcher,
  PlaybackMode,
} from "@/features/steps/components/preview";
import type { ViewportMode } from "@/features/steps/types";
import {
  useSteps,
  useSelectedStep,
  useStepMutations,
  useKeyboardShortcuts,
} from "../../hooks";
import { THEME_DEFAULTS } from "@/features/projects/constants";
import type { Experience } from "../../types";
import type { Step } from "@/features/steps/types";
import type { ProjectTheme as EventTheme } from "@/features/projects/types";

interface ExperienceEditorProps {
  companySlug: string;
  companyId: string;
  experience: Experience;
  onRenameClick?: () => void;
}

// Default theme for experience preview (experiences are company-scoped, not event-specific)
const DEFAULT_PREVIEW_THEME: EventTheme = {
  logoUrl: THEME_DEFAULTS.logoUrl,
  fontFamily: THEME_DEFAULTS.fontFamily,
  primaryColor: THEME_DEFAULTS.primaryColor,
  text: THEME_DEFAULTS.text,
  button: THEME_DEFAULTS.button,
  background: THEME_DEFAULTS.background,
};

export function ExperienceEditor({
  companySlug,
  companyId,
  experience,
  onRenameClick,
}: ExperienceEditorProps) {
  const { steps, loading: stepsLoading } = useSteps(experience.id, experience);
  const { selectedStepId, selectedStep, setSelectedStepId } = useSelectedStep(steps);
  const { duplicateStep } = useStepMutations();

  // URL state for viewport mode (synced with ?preview=mobile|desktop)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read viewport mode from URL, default to mobile
  const previewParam = searchParams.get("preview");
  const viewportMode: ViewportMode =
    previewParam === "desktop" ? "desktop" : "mobile";

  // Update URL when viewport mode changes
  const setViewportMode = useCallback(
    (mode: ViewportMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "mobile") {
        params.delete("preview"); // mobile is default, keep URL clean
      } else {
        params.set("preview", mode);
      }
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Preview state - holds the in-progress form values for live preview
  const [previewStep, setPreviewStep] = useState<Partial<Step> | null>(null);

  // Playback state - controls whether fullscreen playback mode is open
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);

  const handlePlayClick = useCallback(() => {
    setIsPlaybackOpen(true);
  }, []);

  const handlePlaybackExit = useCallback(() => {
    setIsPlaybackOpen(false);
  }, []);

  const handleSelectStep = useCallback(
    (stepId: string) => {
      setSelectedStepId(stepId);
      setPreviewStep(null); // Reset preview state when switching steps
    },
    [setSelectedStepId]
  );

  const handleStepDeleted = useCallback(() => {
    // After deletion, select the next step (or previous if at end), or clear selection
    const currentIndex = steps.findIndex((s) => s.id === selectedStepId);
    const remainingSteps = steps.filter((s) => s.id !== selectedStepId);

    if (remainingSteps.length > 0) {
      // Try to select the step at the same position (next step)
      // If at end, select the previous step (last in remaining)
      const nextIndex = Math.min(currentIndex, remainingSteps.length - 1);
      setSelectedStepId(remainingSteps[nextIndex].id);
    } else {
      setSelectedStepId(null);
    }
    setPreviewStep(null);
  }, [steps, selectedStepId, setSelectedStepId]);

  const handlePreviewChange = useCallback((updates: Partial<Step>) => {
    setPreviewStep(updates);
  }, []);

  // Keyboard shortcut: Duplicate step
  const handleDuplicateStep = useCallback(async () => {
    if (selectedStepId) {
      const result = await duplicateStep(experience.id, selectedStepId);
      if (result.success && result.stepId) {
        setSelectedStepId(result.stepId);
      }
    }
  }, [experience.id, selectedStepId, duplicateStep, setSelectedStepId]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    stepIds: steps.map((s) => s.id),
    selectedStepId,
    onSelectStep: handleSelectStep,
    onDeleteStep: () => {},
    onDuplicateStep: handleDuplicateStep,
    enabled: !stepsLoading,
  });

  // Merge selected step with preview changes for display
  const displayStep = selectedStep
    ? previewStep
      ? { ...selectedStep, ...previewStep }
      : selectedStep
    : null;

  // Empty array for AI presets since experiences are standalone templates
  const aiPresets: never[] = [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ExperienceEditorHeader
        companySlug={companySlug}
        experience={experience}
        onPlayClick={handlePlayClick}
        onRenameClick={onRenameClick}
      />

      {/* Playback Mode Overlay */}
      {isPlaybackOpen && (
        <PlaybackMode
          steps={steps}
          theme={DEFAULT_PREVIEW_THEME}
          aiPresets={aiPresets}
          initialViewport={viewportMode}
          onExit={handlePlaybackExit}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Step List */}
        <aside className="w-full lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r bg-muted/30 shrink-0 overflow-y-auto">
          {stepsLoading ? (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-sm text-muted-foreground">Loading steps...</p>
            </div>
          ) : (
            <StepList
              experienceId={experience.id}
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStep}
            />
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Middle Panel - Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview panel header with viewport switcher */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Preview</h2>
              <ViewSwitcher mode={viewportMode} onChange={setViewportMode} />
            </div>

            {/* Preview content */}
            <div className="flex-1 p-6 overflow-auto bg-muted/10">
              <div className="flex justify-center h-full">
                {displayStep ? (
                  <PreviewRuntime
                    step={displayStep as Step}
                    theme={DEFAULT_PREVIEW_THEME}
                    viewportMode={viewportMode}
                    aiPresets={aiPresets}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">Select a step to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Step Editor */}
          <aside className="w-full md:w-80 xl:w-96 border-t md:border-t-0 md:border-l bg-background shrink-0 overflow-y-auto">
            {selectedStep ? (
              <StepEditor
                experienceId={experience.id}
                companyId={companyId}
                step={selectedStep}
                aiPresets={aiPresets}
                onStepDeleted={handleStepDeleted}
                onPreviewChange={handlePreviewChange}
              />
            ) : (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-sm text-muted-foreground">
                  {steps.length === 0
                    ? "Add a step to get started"
                    : "Select a step to edit"}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
