"use client";

import { useReducer, useTransition, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateExperienceSettingsAction } from "../../actions";
import { uploadStepMedia } from "@/features/steps/actions/step-media";
import { EXPERIENCE_CONSTRAINTS } from "../../constants";
import type { Experience, ExperiencePreviewType } from "../../types";

interface ExperienceSettingsFormProps {
  experience: Experience;
  companyId: string;
}

// Settings form state
type SettingsState = {
  name: string;
  description: string;
  previewMediaUrl: string | null;
  previewType: ExperiencePreviewType | null;
};

// Settings form actions
type SettingsAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_PREVIEW"; payload: { url: string; type: ExperiencePreviewType } }
  | { type: "CLEAR_PREVIEW" };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_PREVIEW":
      return {
        ...state,
        previewMediaUrl: action.payload.url,
        previewType: action.payload.type,
      };
    case "CLEAR_PREVIEW":
      return { ...state, previewMediaUrl: null, previewType: null };
    default:
      return state;
  }
}

/**
 * Experience settings form component.
 * Allows editing experience name, description, and preview media.
 * Uses useReducer pattern for form state management.
 */
export function ExperienceSettingsForm({
  experience,
  companyId,
}: ExperienceSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  // Initialize state from experience
  const initialState: SettingsState = {
    name: experience.name,
    description: experience.description ?? "",
    previewMediaUrl: experience.previewMediaUrl ?? null,
    previewType: experience.previewType ?? null,
  };

  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Media upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (name: string): boolean => {
    if (name.trim().length < EXPERIENCE_CONSTRAINTS.NAME_LENGTH.min) {
      setNameError("Experience name is required");
      return false;
    }
    if (name.length > EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max) {
      setNameError(`Experience name must be ${EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max} characters or less`);
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: "SET_NAME", payload: value });
    if (nameError) {
      validateName(value);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: "SET_DESCRIPTION", payload: e.target.value });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous error
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Validate file type for preview media (only images and GIFs)
      const isImage = EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_IMAGE_TYPES.includes(
        file.type as (typeof EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_IMAGE_TYPES)[number]
      );
      const isGif = EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_GIF_TYPES.includes(
        file.type as (typeof EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_GIF_TYPES)[number]
      );

      if (!isImage && !isGif) {
        setUploadError("Please upload an image (JPG, PNG, WebP) or GIF");
        setIsUploading(false);
        return;
      }

      // Validate file size
      const maxSize = isGif
        ? EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.GIF_MAX_SIZE
        : EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.IMAGE_MAX_SIZE;
      const maxSizeLabel = isGif
        ? EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.GIF_MAX_SIZE_LABEL
        : EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.IMAGE_MAX_SIZE_LABEL;

      if (file.size > maxSize) {
        setUploadError(`File size must be less than ${maxSizeLabel}`);
        setIsUploading(false);
        return;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadStepMedia(companyId, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        const previewType: ExperiencePreviewType = isGif ? "gif" : "image";
        dispatch({
          type: "SET_PREVIEW",
          payload: { url: result.data.publicUrl, type: previewType },
        });
      } else {
        setUploadError(result.error.message);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePreview = () => {
    setUploadError(null);
    dispatch({ type: "CLEAR_PREVIEW" });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    // Validate before save
    if (!validateName(state.name)) {
      return;
    }

    startTransition(async () => {
      const result = await updateExperienceSettingsAction(experience.id, {
        name: state.name.trim(),
        description: state.description.trim() || null,
        previewMediaUrl: state.previewMediaUrl,
        previewType: state.previewType,
      });

      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error.message);
      }
    });
  };

  // Accept string for file input
  const acceptString = [
    ...EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_IMAGE_TYPES,
    ...EXPERIENCE_CONSTRAINTS.PREVIEW_MEDIA.SUPPORTED_GIF_TYPES,
  ].join(",");

  return (
    <div className="space-y-6">
      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="experience-name">Name</Label>
        <Input
          id="experience-name"
          type="text"
          value={state.name}
          onChange={handleNameChange}
          onBlur={() => validateName(state.name)}
          placeholder="Enter experience name"
          maxLength={EXPERIENCE_CONSTRAINTS.NAME_LENGTH.max}
          className={cn(nameError && "border-destructive")}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="experience-description">Description</Label>
        <Textarea
          id="experience-description"
          value={state.description}
          onChange={handleDescriptionChange}
          placeholder="Optional description for your experience"
          maxLength={EXPERIENCE_CONSTRAINTS.DESCRIPTION_LENGTH.max}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {state.description.length}/{EXPERIENCE_CONSTRAINTS.DESCRIPTION_LENGTH.max} characters
        </p>
      </div>

      {/* Preview media upload */}
      <div className="space-y-2">
        <Label>Preview Image</Label>
        <p className="text-xs text-muted-foreground mb-2">
          This image appears on experience cards in the list view.
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          onChange={handleFileSelect}
          disabled={isPending || isUploading}
          className="hidden"
        />

        {/* Preview or Upload Area */}
        {state.previewMediaUrl ? (
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
            <Image
              src={state.previewMediaUrl}
              alt="Preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized={state.previewType === "gif"}
            />

            {/* Remove button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleRemovePreview}
              type="button"
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerFileSelect}
            disabled={isPending || isUploading}
            className={cn(
              "flex aspect-video w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
              isPending || isUploading
                ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground"
                : "cursor-pointer border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Uploading... {uploadProgress}%
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload preview image
                </span>
                <span className="text-xs text-muted-foreground/70">
                  JPG, PNG, WebP (max 5MB) or GIF (max 10MB)
                </span>
              </>
            )}
          </button>
        )}

        {/* Error message */}
        {uploadError && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive max-w-md">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isPending || isUploading}
        className="w-full sm:w-auto min-h-[44px] min-w-[120px]"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
