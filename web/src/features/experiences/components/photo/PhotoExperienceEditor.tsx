"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ExperienceEditorHeader } from "../shared/ExperienceEditorHeader";
import { AITransformSettings } from "../shared/AITransformSettings";
import { AIPlayground } from "../shared/AIPlayground";
import { CountdownSettings } from "./CountdownSettings";
import { OverlaySettings } from "./OverlaySettings";
import { updatePhotoExperience } from "../../actions/photo-update";
import type { PhotoExperience, PreviewType, AspectRatio } from "../../schemas";

interface PhotoExperienceEditorProps {
  experience: PhotoExperience;
  onSave: (experienceId: string, data: Partial<PhotoExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * PhotoExperienceEditor - Photo-specific experience configuration
 * Updated to use unified ExperienceEditorHeader component
 *
 * Features:
 * - Unified header: Preview media, title, enabled toggle, delete button
 * - Photo-specific: Countdown timer, overlay frame
 * - AI transformation (shared with GIF/Video types)
 *
 * Uses:
 * - ExperienceEditorHeader (unified header for all experience types)
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

  // Local form state - read from new schema (data-model-v4)
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(experience.previewMediaUrl || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType || undefined);

  // Countdown settings - countdown: 0 means disabled, countdown: N means N seconds
  const [countdownSeconds, setCountdownSeconds] = useState(experience.captureConfig.countdown);

  // Overlay settings - read from captureConfig.overlayUrl
  const [overlayUrl, setOverlayUrl] = useState(experience.captureConfig.overlayUrl || "");

  // AI settings - read from aiPhotoConfig
  const [aiEnabled, setAiEnabled] = useState(experience.aiPhotoConfig.enabled);
  const [aiModel, setAiModel] = useState(experience.aiPhotoConfig.model || "gemini-2.5-flash-image");
  const [aiPrompt, setAiPrompt] = useState(experience.aiPhotoConfig.prompt || "");
  const [aiReferenceImageUrls, setAiReferenceImageUrls] = useState<string[]>(
    experience.aiPhotoConfig.referenceImageUrls || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(experience.aiPhotoConfig.aspectRatio || "1:1");

  // Handle title save
  const handleTitleSave = async (newTitle: string) => {
    const result = await updatePhotoExperience(experience.id, {
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
    const result = await updatePhotoExperience(experience.id, {
      enabled: newEnabled,
    });
    if (!result.success) {
      setEnabled(!newEnabled); // Revert on error
      toast.error(result.error.message);
    } else {
      toast.success(`Experience ${newEnabled ? "enabled" : "disabled"}`);
    }
  };

  // Handle save - write to new schema structure (captureConfig/aiPhotoConfig)
  // Note: Preview media is saved automatically via PreviewMediaCompact component
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          enabled,
          // Write to captureConfig object structure
          captureConfig: {
            countdown: countdownSeconds, // 0 = disabled, N = N seconds
            cameraFacing: experience.captureConfig.cameraFacing,
            overlayUrl: overlayUrl || null,
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
        toast.success("Experience updated successfully");
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
    const result = await updatePhotoExperience(experience.id, {
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
    const result = await updatePhotoExperience(experience.id, {
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

      {/* Split-Screen Layout: Config Panel (left) | Playground (right) */}
      {/* Stacks vertically on mobile (<1024px), side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Configuration */}
        <div className="space-y-6">
          {/* Countdown Timer */}
          <CountdownSettings
            countdownSeconds={countdownSeconds}
            onCountdownSecondsChange={setCountdownSeconds}
            disabled={isPending}
          />

          {/* Frame Overlay */}
          <OverlaySettings
            experienceId={experience.id}
            overlayUrl={overlayUrl || undefined}
            onUpload={(url) => setOverlayUrl(url)}
            onRemove={() => setOverlayUrl("")}
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
            className="w-full min-h-[44px]"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Right Panel: AI Playground - Always visible for testing */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AIPlayground
            experienceId={experience.id}
            prompt={aiPrompt}
            disabled={isPending || !aiEnabled}
          />
        </div>
      </div>
    </div>
  );
}
