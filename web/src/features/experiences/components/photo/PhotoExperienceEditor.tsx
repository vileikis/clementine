"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { BaseExperienceFields } from "../shared/BaseExperienceFields";
import { DeleteExperienceButton } from "../shared/DeleteExperienceButton";
import { PreviewMediaUpload } from "../shared/PreviewMediaUpload";
import { AITransformSettings } from "../shared/AITransformSettings";
import { CountdownSettings } from "./CountdownSettings";
import { OverlaySettings } from "./OverlaySettings";
import type { PhotoExperience, PreviewType, AspectRatio } from "../../lib/schemas";

interface PhotoExperienceEditorProps {
  experience: PhotoExperience;
  onSave: (experienceId: string, data: Partial<PhotoExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * PhotoExperienceEditor - Photo-specific experience configuration
 * Refactored in Phase 2 (User Story 1) to use shared components
 *
 * Features:
 * - Shared: Label, enabled status, preview media, delete (via shared components)
 * - Photo-specific: Countdown timer, overlay frame
 * - AI transformation (shared with GIF/Video types)
 *
 * Uses:
 * - BaseExperienceFields (label, enabled)
 * - DeleteExperienceButton (delete with confirmation)
 * - PreviewMediaUpload (shared)
 * - AITransformSettings (shared)
 * - CountdownSettings (photo-specific, but reusable)
 * - OverlaySettings (photo-specific)
 */
export function PhotoExperienceEditor({
  experience,
  onSave,
  onDelete,
}: PhotoExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();

  // Local form state - read from new schema
  const [label, setLabel] = useState(experience.label);
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewPath, setPreviewPath] = useState(experience.previewPath || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType);

  // Countdown settings - countdown: 0 means disabled, countdown: N means N seconds
  const [countdownSeconds, setCountdownSeconds] = useState(experience.config.countdown);

  // Overlay settings - read from config.overlayFramePath
  const [overlayEnabled, setOverlayEnabled] = useState(!!experience.config.overlayFramePath);
  const [overlayFramePath, setOverlayFramePath] = useState(experience.config.overlayFramePath || "");

  // AI settings - read from aiConfig
  const [aiEnabled, setAiEnabled] = useState(experience.aiConfig.enabled);
  const [aiModel, setAiModel] = useState(experience.aiConfig.model || "nanobanana");
  const [aiPrompt, setAiPrompt] = useState(experience.aiConfig.prompt || "");
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
    experience.aiConfig.referenceImagePaths || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(experience.aiConfig.aspectRatio);

  // Handle save - write to new schema structure (config/aiConfig)
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          label,
          enabled,
          previewPath: previewPath || undefined,
          previewType: previewType || undefined,
          // Write to config object structure
          config: {
            countdown: countdownSeconds, // 0 = disabled, N = N seconds
            overlayFramePath: overlayEnabled && overlayFramePath ? overlayFramePath : null,
          },
          // Write to aiConfig object structure
          aiConfig: {
            enabled: aiEnabled,
            model: aiModel || null,
            prompt: aiPrompt || null,
            referenceImagePaths: aiReferenceImagePaths.length > 0 ? aiReferenceImagePaths : null,
            aspectRatio: aiAspectRatio,
          },
        });
        toast.success("Experience updated successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save experience");
      }
    });
  };

  // Handle preview media upload
  const handlePreviewMediaUpload = (publicUrl: string, fileType: PreviewType) => {
    setPreviewPath(publicUrl);
    setPreviewType(fileType);
  };

  // Handle preview media removal
  const handlePreviewMediaRemove = () => {
    setPreviewPath("");
    setPreviewType(undefined);
  };

  // Keyboard shortcuts: Cmd+S / Ctrl+S to save
  useKeyboardShortcuts({
    "Cmd+S": handleSave,
    "Ctrl+S": handleSave,
  });

  // Handle experience deletion
  const handleDelete = async () => {
    await onDelete(experience.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Edit Photo Experience</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure photo capture and AI transformation settings
          </p>
        </div>
        <DeleteExperienceButton
          experienceLabel={experience.label}
          onDelete={handleDelete}
          disabled={isPending}
        />
      </div>

      {/* Shared Base Fields (Label, Enabled) */}
      <BaseExperienceFields
        label={label}
        enabled={enabled}
        onLabelChange={setLabel}
        onEnabledChange={setEnabled}
        disabled={isPending}
      />

      {/* Preview Media */}
      <PreviewMediaUpload
        eventId={experience.eventId}
        experienceId={experience.id}
        previewPath={previewPath}
        previewType={previewType}
        onUpload={handlePreviewMediaUpload}
        onRemove={handlePreviewMediaRemove}
        disabled={isPending}
      />

      {/* Countdown Timer */}
      <CountdownSettings
        countdownSeconds={countdownSeconds}
        onCountdownSecondsChange={setCountdownSeconds}
        disabled={isPending}
      />

      {/* Frame Overlay */}
      <OverlaySettings
        eventId={experience.eventId}
        experienceId={experience.id}
        overlayEnabled={overlayEnabled}
        overlayFramePath={overlayFramePath || undefined}
        onOverlayEnabledChange={setOverlayEnabled}
        onUpload={(url) => setOverlayFramePath(url)}
        onRemove={() => setOverlayFramePath("")}
        disabled={isPending}
      />

      {/* AI Transformation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">AI Transformation</h2>
          <div className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
            <Switch
              id="aiEnabled"
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
              disabled={isPending}
            />
          </div>
        </div>

        {aiEnabled && (
          <AITransformSettings
            aiModel={aiModel}
            aiPrompt={aiPrompt}
            aiReferenceImagePaths={aiReferenceImagePaths}
            aiAspectRatio={aiAspectRatio}
            onAiModelChange={setAiModel}
            onAiPromptChange={setAiPrompt}
            onAiReferenceImagePathsChange={setAiReferenceImagePaths}
            onAiAspectRatioChange={setAiAspectRatio}
            disabled={isPending}
          />
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
