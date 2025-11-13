"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
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
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Local form state
  const [label, setLabel] = useState(experience.label);
  const [enabled, setEnabled] = useState(experience.enabled);
  const [allowCamera, setAllowCamera] = useState(experience.allowCamera);
  const [allowLibrary, setAllowLibrary] = useState(experience.allowLibrary);
  const [overlayFramePath, setOverlayFramePath] = useState(experience.overlayFramePath || "");
  const [overlayLogoPath, setOverlayLogoPath] = useState(experience.overlayLogoPath || "");
  const [aiEnabled, setAiEnabled] = useState(experience.aiEnabled);
  const [aiModel, setAiModel] = useState(experience.aiModel || "");
  const [aiPrompt, setAiPrompt] = useState(experience.aiPrompt || "");
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState<string[]>(
    experience.aiReferenceImagePaths || []
  );

  // Handle save
  const handleSave = () => {
    setSaveMessage(null);
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
        setSaveMessage({ type: "success", text: "Experience updated successfully" });
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (error) {
        setSaveMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to save experience"
        });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    });
  };

  // Handle experience deletion
  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await onDelete(experience.id);
        setShowDeleteDialog(false);
      } catch (error) {
        setSaveMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Failed to delete experience"
        });
        setTimeout(() => setSaveMessage(null), 5000);
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
    <div className="space-y-6 p-6">
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

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

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
          aspectRatio="aspect-square"
          recommendedSize="Recommended: 1080x1080px. Max 10MB."
        />

        <ImageUploadField
          id="overlay-logo"
          label="Logo Overlay"
          value={overlayLogoPath}
          onChange={setOverlayLogoPath}
          destination="experience-overlay"
          disabled={isPending}
          aspectRatio="aspect-square"
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
              <Input
                id="aiModel"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="e.g., stable-diffusion-xl"
                disabled={isPending}
              />
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
                  <div key={index} className="relative aspect-video w-full overflow-hidden rounded-lg border">
                    <img
                      src={path}
                      alt={`Reference ${index + 1}`}
                      className="h-full w-full object-cover"
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
                  aspectRatio="aspect-video"
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
