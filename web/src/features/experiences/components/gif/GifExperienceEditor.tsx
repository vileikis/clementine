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
import { GifCaptureSettings } from "./GifCaptureSettings";
import type { GifExperience, PreviewType, AspectRatio } from "../../lib/schemas";

interface GifExperienceEditorProps {
  experience: GifExperience;
  onSave: (experienceId: string, data: Partial<GifExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * GifExperienceEditor - GIF-specific experience configuration
 * Part of 004-multi-experience-editor implementation (User Story 2)
 *
 * Features:
 * - Shared: Label, enabled status, preview media, delete (via shared components)
 * - GIF-specific: Frame count, interval, loop count, countdown
 * - AI transformation (shared with Photo/Video types)
 *
 * Uses:
 * - BaseExperienceFields (label, enabled)
 * - DeleteExperienceButton (delete with confirmation)
 * - PreviewMediaUpload (shared)
 * - AITransformSettings (shared)
 * - GifCaptureSettings (GIF-specific)
 */
export function GifExperienceEditor({
  experience,
  onSave,
  onDelete,
}: GifExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();

  // Local form state - read from schema
  const [label, setLabel] = useState(experience.label);
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewPath, setPreviewPath] = useState(experience.previewPath || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType);

  // GIF capture settings - read from config
  const [frameCount, setFrameCount] = useState(experience.config.frameCount);
  const [intervalMs, setIntervalMs] = useState(experience.config.intervalMs);
  const [loopCount, setLoopCount] = useState(experience.config.loopCount);
  const [countdown, setCountdown] = useState(experience.config.countdown || 0);

  // AI settings - read from aiConfig
  const [aiEnabled, setAiEnabled] = useState(experience.aiConfig.enabled);
  const [aiModel, setAiModel] = useState(experience.aiConfig.model || "nanobanana");
  const [aiPrompt, setAiPrompt] = useState(experience.aiConfig.prompt || "");
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
    experience.aiConfig.referenceImagePaths || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(experience.aiConfig.aspectRatio);

  // Handle save - write to schema structure (config/aiConfig)
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
            frameCount,
            intervalMs,
            loopCount,
            countdown: countdown || undefined,
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
        toast.success("GIF experience updated successfully");
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
          <h2 className="text-2xl font-semibold">Edit GIF Experience</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure GIF capture settings and AI transformation
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

      {/* GIF Capture Settings */}
      <GifCaptureSettings
        frameCount={frameCount}
        intervalMs={intervalMs}
        loopCount={loopCount}
        countdown={countdown}
        onFrameCountChange={setFrameCount}
        onIntervalMsChange={setIntervalMs}
        onLoopCountChange={setLoopCount}
        onCountdownChange={setCountdown}
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
