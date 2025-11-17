"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { PreviewMediaUpload } from "./PreviewMediaUpload";
import { CountdownSettings } from "./CountdownSettings";
import { OverlaySettings } from "./OverlaySettings";
import { AITransformSettings } from "./AITransformSettings";
import type { Experience } from "@/lib/types/firestore";
import type { PreviewType, AspectRatio } from "@/lib/types/firestore";

interface ExperienceEditorProps {
  experience: Experience;
  onSave: (experienceId: string, data: Partial<Experience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * ExperienceEditor component for configuring photo experience settings.
 * Updated in 001-photo-experience-tweaks to simplify configuration.
 *
 * Features:
 * - Basic settings (label, enabled)
 * - Overlays (frame only - logo removed in 001-photo-experience-tweaks)
 * - AI transformation (prompt, reference images, model)
 * - Delete experience with confirmation
 * - Save button (not auto-save)
 *
 * Removed in 001-photo-experience-tweaks:
 * - Capture options (camera, library) - always available to guests now
 * - Logo overlay - simplified to single frame overlay only
 */
export function ExperienceEditor({
  experience,
  onSave,
  onDelete,
  className,
}: ExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Local form state
  const [label, setLabel] = useState(experience.label);
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewPath, setPreviewPath] = useState(experience.previewPath || "");
  const [previewType, setPreviewType] = useState<PreviewType | undefined>(experience.previewType);
  const [overlayEnabled, setOverlayEnabled] = useState(experience.overlayEnabled ?? false);
  const [overlayFramePath, setOverlayFramePath] = useState(experience.overlayFramePath || "");
  const [aiEnabled, setAiEnabled] = useState(experience.aiEnabled);
  const [aiModel, setAiModel] = useState(experience.aiModel || "nanobanana");
  const [aiPrompt, setAiPrompt] = useState(experience.aiPrompt || "");
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
    experience.aiReferenceImagePaths || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState<AspectRatio>(experience.aiAspectRatio || "1:1");
  const [countdownEnabled, setCountdownEnabled] = useState(experience.countdownEnabled ?? false);
  const [countdownSeconds, setCountdownSeconds] = useState(experience.countdownSeconds ?? 3);

  // Handle save
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          label,
          enabled,
          previewPath: previewPath || undefined,
          previewType: previewType || undefined,
          overlayEnabled,
          overlayFramePath: overlayFramePath || undefined,
          countdownEnabled,
          countdownSeconds,
          aiEnabled,
          aiModel: aiModel || undefined,
          aiPrompt: aiPrompt || undefined,
          aiReferenceImagePaths: aiReferenceImagePaths.length > 0 ? aiReferenceImagePaths : undefined,
          aiAspectRatio,
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
    startTransition(async () => {
      try {
        await onDelete(experience.id);
        setShowDeleteDialog(false);
        toast.success("Experience deleted successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete experience");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Edit Experience</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure photo experience settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="enabled" className="text-sm font-medium">
              Enable
            </Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isPending}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Experience Label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Neon Portrait"
            disabled={isPending}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            {label.length}/50 characters
          </p>
        </div>
      </div>

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
        countdownEnabled={countdownEnabled}
        countdownSeconds={countdownSeconds}
        onCountdownEnabledChange={setCountdownEnabled}
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
          <Switch
            id="aiEnabled"
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
            disabled={isPending}
          />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{experience.label}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
