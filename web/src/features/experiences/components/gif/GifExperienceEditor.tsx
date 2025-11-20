"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ExperienceEditorHeader } from "../shared/ExperienceEditorHeader";
import { AITransformSettings } from "../shared/AITransformSettings";
import { GifCaptureSettings } from "./GifCaptureSettings";
import { updateGifExperience } from "../../actions/gif-update";
import type { GifExperience, PreviewType, AspectRatio } from "../../lib/schemas";

interface GifExperienceEditorProps {
  experience: GifExperience;
  onSave: (experienceId: string, data: Partial<GifExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * GifExperienceEditor - GIF-specific experience configuration
 * Updated to use unified ExperienceEditorHeader component
 *
 * Features:
 * - Unified header: Preview media, title, enabled toggle, delete button
 * - GIF-specific: Frame count, interval, loop count, countdown
 * - AI transformation (shared with Photo/Video types)
 *
 * Uses:
 * - ExperienceEditorHeader (unified header for all experience types)
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
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewPath, setPreviewPath] = useState(experience.previewPath || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType || undefined);

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

  // Handle title save
  const handleTitleSave = async (newTitle: string) => {
    const result = await updateGifExperience(experience.eventId, experience.id, {
      label: newTitle,
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    toast.success("Experience name updated");
  };

  // Handle enabled toggle
  const handleEnabledChange = async (newEnabled: boolean) => {
    setEnabled(newEnabled);
    const result = await updateGifExperience(experience.eventId, experience.id, {
      enabled: newEnabled,
    });
    if (!result.success) {
      setEnabled(!newEnabled); // Revert on error
      toast.error(result.error.message);
    } else {
      toast.success(`Experience ${newEnabled ? "enabled" : "disabled"}`);
    }
  };

  // Handle save - write to schema structure (config/aiConfig)
  // Note: Preview media is saved automatically via PreviewMediaCompact component
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          enabled,
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

  // Handle preview media upload - save immediately
  const handlePreviewMediaUpload = async (publicUrl: string, fileType: PreviewType) => {
    setPreviewPath(publicUrl);
    setPreviewType(fileType);

    // Save to database immediately
    const result = await updateGifExperience(experience.eventId, experience.id, {
      previewPath: publicUrl,
      previewType: fileType,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewPath(experience.previewPath || "");
      setPreviewType(experience.previewType || undefined);
      toast.error("Failed to save preview media");
    } else {
      toast.success("Preview media updated");
    }
  };

  // Handle preview media removal - save immediately
  const handlePreviewMediaRemove = async () => {
    setPreviewPath("");
    setPreviewType(undefined);

    // Save to database immediately (use null to clear the fields)
    const result = await updateGifExperience(experience.eventId, experience.id, {
      previewPath: null,
      previewType: null,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewPath(experience.previewPath || "");
      setPreviewType(experience.previewType || undefined);
      toast.error("Failed to remove preview media");
    } else {
      toast.success("Preview media removed");
    }
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
      {/* Unified Experience Editor Header */}
      <ExperienceEditorHeader
        eventId={experience.eventId}
        experience={experience}
        showPreview={true}
        previewPath={previewPath}
        previewType={previewType}
        onPreviewUpload={handlePreviewMediaUpload}
        onPreviewRemove={handlePreviewMediaRemove}
        onTitleSave={handleTitleSave}
        enabled={enabled}
        onEnabledChange={handleEnabledChange}
        onDelete={handleDelete}
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
