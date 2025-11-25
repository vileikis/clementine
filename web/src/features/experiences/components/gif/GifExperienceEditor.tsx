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
import type { GifExperience, PreviewType, AspectRatio } from "../../schemas";

interface GifExperienceEditorProps {
  eventId: string;
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
  eventId,
  experience,
  onSave,
  onDelete,
}: GifExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();

  // Local form state - read from new schema (data-model-v4)
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(experience.previewMediaUrl || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType || undefined);

  // GIF capture settings - read from captureConfig
  const [frameCount, setFrameCount] = useState(experience.captureConfig.frameCount);
  const [countdown, setCountdown] = useState(experience.captureConfig.countdown || 0);

  // AI settings - read from aiPhotoConfig
  const [aiEnabled, setAiEnabled] = useState(experience.aiPhotoConfig.enabled);
  const [aiModel, setAiModel] = useState(experience.aiPhotoConfig.model || "nanobanana");
  const [aiPrompt, setAiPrompt] = useState(experience.aiPhotoConfig.prompt || "");
  const [aiReferenceImageUrls, setAiReferenceImageUrls] = useState<string[]>(
    experience.aiPhotoConfig.referenceImageUrls || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(experience.aiPhotoConfig.aspectRatio || "1:1");

  // Handle title save
  const handleTitleSave = async (newTitle: string) => {
    const result = await updateGifExperience(experience.id, {
      name: newTitle,
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    toast.success("Experience name updated");
  };

  // Handle enabled toggle
  const handleEnabledChange = async (newEnabled: boolean) => {
    setEnabled(newEnabled);
    const result = await updateGifExperience(experience.id, {
      enabled: newEnabled,
    });
    if (!result.success) {
      setEnabled(!newEnabled); // Revert on error
      toast.error(result.error.message);
    } else {
      toast.success(`Experience ${newEnabled ? "enabled" : "disabled"}`);
    }
  };

  // Handle save - write to schema structure (captureConfig/aiPhotoConfig)
  // Note: Preview media is saved automatically via PreviewMediaCompact component
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          enabled,
          // Write to captureConfig object structure
          captureConfig: {
            frameCount,
            cameraFacing: experience.captureConfig.cameraFacing,
            countdown: countdown || 0,
          },
          // Write to aiPhotoConfig object structure
          aiPhotoConfig: {
            enabled: aiEnabled,
            model: aiModel || null,
            prompt: aiPrompt || null,
            referenceImageUrls: aiReferenceImageUrls.length > 0 ? aiReferenceImageUrls : null,
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
    setPreviewMediaUrl(publicUrl);
    setPreviewType(fileType);

    // Save to database immediately
    const result = await updateGifExperience(experience.id, {
      previewMediaUrl: publicUrl,
      previewType: fileType,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewMediaUrl(experience.previewMediaUrl || "");
      setPreviewType(experience.previewType || undefined);
      toast.error("Failed to save preview media");
    } else {
      toast.success("Preview media updated");
    }
  };

  // Handle preview media removal - save immediately
  const handlePreviewMediaRemove = async () => {
    setPreviewMediaUrl("");
    setPreviewType(undefined);

    // Save to database immediately (use null to clear the fields)
    const result = await updateGifExperience(experience.id, {
      previewMediaUrl: null,
      previewType: null,
    });

    if (!result.success) {
      // Revert local state on error
      setPreviewMediaUrl(experience.previewMediaUrl || "");
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
        experience={experience}
        eventId={eventId}
        showPreview={true}
        previewMediaUrl={previewMediaUrl}
        previewMediaType={previewType}
        onPreviewUpload={handlePreviewMediaUpload}
        onPreviewRemove={handlePreviewMediaRemove}
        onTitleSave={handleTitleSave}
        enabled={enabled}
        onEnabledChange={handleEnabledChange}
        onDelete={handleDelete}
        disabled={isPending}
      />

      {/* Body Content - Centered with max width */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* GIF Capture Settings */}
        <GifCaptureSettings
        frameCount={frameCount}
        countdown={countdown}
        onFrameCountChange={setFrameCount}
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
            aiReferenceImageUrls={aiReferenceImageUrls}
            aiAspectRatio={aiAspectRatio}
            onAiModelChange={setAiModel}
            onAiPromptChange={setAiPrompt}
            onAiReferenceImageUrlsChange={setAiReferenceImageUrls}
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
    </div>
  );
}
