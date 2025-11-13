"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Experience } from "@/lib/types/firestore";

interface ExperienceEditorProps {
  experience: Experience;
  onUpdate: (experienceId: string, data: Partial<Experience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
  onUploadImage: (file: File, destination: "experience-preview" | "experience-overlay" | "ai-reference") => Promise<{ path: string; url: string }>;
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
 */
export function ExperienceEditor({
  experience,
  onUpdate,
  onDelete,
  onUploadImage,
  className,
}: ExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [localData, setLocalData] = useState(experience);

  // Handle field updates with auto-save
  const handleFieldChange = (field: keyof Experience, value: unknown) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);

    // Auto-save after field change
    startTransition(async () => {
      await onUpdate(experience.id, { [field]: value });
    });
  };

  // Handle file upload for overlays/previews
  const handleFileUpload = async (
    field: "previewPath" | "overlayFramePath" | "overlayLogoPath",
    destination: "experience-preview" | "experience-overlay"
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      startTransition(async () => {
        const { path } = await onUploadImage(file, destination);
        handleFieldChange(field, path);
      });
    };
    input.click();
  };

  // Handle AI reference image upload
  const handleAddReferenceImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      startTransition(async () => {
        const { path } = await onUploadImage(file, "ai-reference");
        const currentPaths = localData.aiReferenceImagePaths || [];
        handleFieldChange("aiReferenceImagePaths", [...currentPaths, path]);
      });
    };
    input.click();
  };

  // Handle experience deletion
  const handleDelete = async () => {
    startTransition(async () => {
      await onDelete(experience.id);
      setShowDeleteDialog(false);
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Edit Experience</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure photo experience settings
          </p>
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

      {/* Basic Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Settings</h3>

        <div className="space-y-2">
          <Label htmlFor="label">Experience Label</Label>
          <Input
            id="label"
            value={localData.label}
            onChange={(e) => handleFieldChange("label", e.target.value)}
            placeholder="e.g., Neon Portrait"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Experience</Label>
            <p className="text-xs text-muted-foreground">
              Make this experience available to guests
            </p>
          </div>
          <Switch
            id="enabled"
            checked={localData.enabled}
            onCheckedChange={(checked) => handleFieldChange("enabled", checked)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Capture Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Capture Options</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowCamera">Allow Camera</Label>
            <p className="text-xs text-muted-foreground">
              Let guests take photos with their camera
            </p>
          </div>
          <Switch
            id="allowCamera"
            checked={localData.allowCamera}
            onCheckedChange={(checked) => handleFieldChange("allowCamera", checked)}
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
            checked={localData.allowLibrary}
            onCheckedChange={(checked) => handleFieldChange("allowLibrary", checked)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Overlays */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Overlays</h3>

        <div className="space-y-2">
          <Label>Frame Overlay</Label>
          <div className="flex gap-2">
            {localData.overlayFramePath ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={localData.overlayFramePath}
                  disabled
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFieldChange("overlayFramePath", undefined)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFileUpload("overlayFramePath", "experience-overlay")}
                disabled={isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Frame
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo Overlay</Label>
          <div className="flex gap-2">
            {localData.overlayLogoPath ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={localData.overlayLogoPath}
                  disabled
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFieldChange("overlayLogoPath", undefined)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFileUpload("overlayLogoPath", "experience-overlay")}
                disabled={isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Transformation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">AI Transformation</h3>
          <Switch
            id="aiEnabled"
            checked={localData.aiEnabled}
            onCheckedChange={(checked) => handleFieldChange("aiEnabled", checked)}
            disabled={isPending}
          />
        </div>

        {localData.aiEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Input
                id="aiModel"
                value={localData.aiModel || ""}
                onChange={(e) => handleFieldChange("aiModel", e.target.value)}
                placeholder="e.g., stable-diffusion-xl"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiPrompt">AI Prompt</Label>
              <Textarea
                id="aiPrompt"
                value={localData.aiPrompt || ""}
                onChange={(e) => handleFieldChange("aiPrompt", e.target.value)}
                placeholder="Describe the AI transformation..."
                rows={4}
                maxLength={600}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {localData.aiPrompt?.length || 0}/600 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reference Images</Label>
              <div className="space-y-2">
                {localData.aiReferenceImagePaths?.map((path, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={path} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = localData.aiReferenceImagePaths?.filter((_, i) => i !== index);
                        handleFieldChange("aiReferenceImagePaths", updated);
                      }}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddReferenceImage}
                  disabled={isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Reference Image
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
