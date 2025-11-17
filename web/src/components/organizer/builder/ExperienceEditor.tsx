"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ImageUploadField } from "./ImageUploadField";
import type { Experience } from "@/lib/types/firestore";

interface ExperienceEditorProps {
  experience: Experience;
  onSave: (experienceId: string, data: Partial<Experience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  className?: string;
}

/**
 * ExperienceEditor component for configuring photo experience settings.
 * Part of Phase 6 (User Story 3) - Manage Photo Experiences
 *
 * Features:
 * - Basic settings (label, enabled)
 * - Capture options (camera, library)
 * - Overlays (frame, logo)
 * - AI transformation (prompt, reference images, model)
 * - Delete experience with confirmation
 * - Save button (not auto-save)
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
  const [allowCamera, setAllowCamera] = useState(experience.allowCamera);
  const [allowLibrary, setAllowLibrary] = useState(experience.allowLibrary);
  const [overlayFramePath, setOverlayFramePath] = useState(experience.overlayFramePath || "");
  const [overlayLogoPath, setOverlayLogoPath] = useState(experience.overlayLogoPath || "");
  const [aiEnabled, setAiEnabled] = useState(experience.aiEnabled);
  const [aiModel, setAiModel] = useState(experience.aiModel || "nanobanana");
  const [aiPrompt, setAiPrompt] = useState(experience.aiPrompt || "");
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
    experience.aiReferenceImagePaths || []
  );

  // Handle save
  const handleSave = () => {
    if (isPending) return; // Prevent multiple saves
    startTransition(async () => {
      try {
        await onSave(experience.id, {
          label,
          enabled,
          allowCamera,
          allowLibrary,
          overlayFramePath: overlayFramePath || undefined,
          overlayLogoPath: overlayLogoPath || undefined,
          aiEnabled,
          aiModel: aiModel || undefined,
          aiPrompt: aiPrompt || undefined,
          aiReferenceImagePaths: aiReferenceImagePaths.length > 0 ? aiReferenceImagePaths : undefined,
        });
        toast.success("Experience updated successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save experience");
      }
    });
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

  // Handle AI reference image addition
  const handleAddReferenceImage = (url: string) => {
    setAiReferenceImagePaths([...aiReferenceImagePaths, url]);
  };

  // Handle AI reference image removal
  const handleRemoveReferenceImage = (index: number) => {
    setAiReferenceImagePaths(aiReferenceImagePaths.filter((_, i) => i !== index));
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

      {/* Capture Options */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Capture Options</h2>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowCamera">Allow Camera</Label>
            <p className="text-xs text-muted-foreground">
              Let guests take photos with their camera
            </p>
          </div>
          <Switch
            id="allowCamera"
            checked={allowCamera}
            onCheckedChange={setAllowCamera}
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowLibrary">Allow Photo Library</Label>
            <p className="text-xs text-muted-foreground">
              Let guests upload from their photo library
            </p>
          </div>
          <Switch
            id="allowLibrary"
            checked={allowLibrary}
            onCheckedChange={setAllowLibrary}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Overlays */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Overlays</h2>

        <ImageUploadField
          id="overlay-frame"
          label="Frame Overlay"
          value={overlayFramePath}
          onChange={setOverlayFramePath}
          destination="experience-overlay"
          disabled={isPending}
          recommendedSize="Recommended: 1080x1080px. Max 10MB."
        />

        <ImageUploadField
          id="overlay-logo"
          label="Logo Overlay"
          value={overlayLogoPath}
          onChange={setOverlayLogoPath}
          destination="experience-overlay"
          disabled={isPending}
          recommendedSize="Recommended: 512x512px. Max 10MB."
        />
      </div>

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
          <>
            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Select
                value={aiModel}
                onValueChange={setAiModel}
                disabled={isPending}
              >
                <SelectTrigger id="aiModel">
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nanobanana">Nano Banana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiPrompt">AI Prompt</Label>
              <Textarea
                id="aiPrompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the AI transformation..."
                rows={4}
                maxLength={600}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {aiPrompt.length}/600 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reference Images</Label>
              <div className="space-y-4">
                {aiReferenceImagePaths.map((path, index) => (
                  <div key={index} className="relative w-full h-32 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={path}
                      alt={`Reference ${index + 1}`}
                      className="h-full w-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveReferenceImage(index)}
                      disabled={isPending}
                      type="button"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <ImageUploadField
                  id={`ai-reference-${aiReferenceImagePaths.length}`}
                  label={aiReferenceImagePaths.length === 0 ? "Add Reference Image" : "Add Another Reference"}
                  value=""
                  onChange={handleAddReferenceImage}
                  destination="ai-reference"
                  disabled={isPending}
                  recommendedSize="Max 10MB."
                />
              </div>
            </div>
          </>
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
