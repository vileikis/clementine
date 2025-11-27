"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Copy } from "lucide-react";
import { PreviewMediaCompact } from "./PreviewMediaCompact";
import { DeleteExperienceButton } from "./DeleteExperienceButton";
import type { Experience, PreviewType } from "../../schemas";
import { duplicateExperience } from "../../actions/duplicate";

interface ExperienceEditorHeaderProps {
  // Experience data
  experience: Experience;

  // Event ID for navigation after duplicate
  eventId: string;

  // Preview media (optional - can be omitted for types that don't need it)
  showPreview?: boolean;
  previewMediaUrl?: string;
  previewMediaType?: PreviewType;
  onPreviewUpload?: (publicUrl: string, fileType: PreviewType) => void;
  onPreviewRemove?: () => void;

  // Title editing
  onTitleSave: (newTitle: string) => Promise<void>;

  // Enabled toggle
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => Promise<void>;

  // Delete
  onDelete: () => Promise<void>;

  // Optional: Additional controls for Row 3
  additionalControls?: React.ReactNode;

  // Loading/disabled states
  disabled?: boolean;
}

/**
 * ExperienceEditorHeader - Unified header component for all experience editors
 *
 * Provides three rows:
 * - Row 1: Compact preview media (optional)
 * - Row 2: Editable title + Delete button
 * - Row 3: Enabled toggle + optional additional controls
 *
 * Created for unified experience editor header (see unified-experience-header-requirements.md)
 */
export function ExperienceEditorHeader({
  experience,
  eventId,
  showPreview = true,
  previewMediaUrl,
  previewMediaType,
  onPreviewUpload,
  onPreviewRemove,
  onTitleSave,
  enabled,
  onEnabledChange,
  onDelete,
  additionalControls,
  disabled = false,
}: ExperienceEditorHeaderProps) {
  // Title editing dialog state
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [titleInput, setTitleInput] = useState(experience.name);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isTitlePending, startTitleTransition] = useTransition();

  // Enabled toggle state
  const [isEnabledPending, startEnabledTransition] = useTransition();

  // Duplicate state
  const [isDuplicatePending, startDuplicateTransition] = useTransition();
  const router = useRouter();

  const handleDuplicate = () => {
    startDuplicateTransition(async () => {
      const result = await duplicateExperience(experience.id, eventId);
      if (result.success) {
        toast.success("Experience duplicated");
        // Navigate to the new experience
        router.push(`/events/${eventId}/experiences/${result.data.id}`);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleTitleClick = () => {
    setTitleInput(experience.name);
    setTitleError(null);
    setIsTitleDialogOpen(true);
  };

  const handleTitleSave = () => {
    if (!titleInput.trim()) {
      setTitleError("Experience name is required");
      return;
    }
    if (titleInput.length > 100) {
      setTitleError("Experience name must be 100 characters or less");
      return;
    }

    setTitleError(null);
    startTitleTransition(async () => {
      try {
        await onTitleSave(titleInput.trim());
        setIsTitleDialogOpen(false);
      } catch (error) {
        setTitleError(
          error instanceof Error ? error.message : "Failed to update experience name"
        );
      }
    });
  };

  const handleTitleCancel = () => {
    setTitleInput(experience.name);
    setTitleError(null);
    setIsTitleDialogOpen(false);
  };

  const handleEnabledChange = (checked: boolean) => {
    startEnabledTransition(async () => {
      await onEnabledChange(checked);
    });
  };

  return (
    <div className="mb-8">
      {/* 2-Column Layout: Preview Media | Title + Controls */}
      <div className="flex gap-6 items-center">
        {/* Column 1: Preview Media (always shown as square) */}
        {showPreview && onPreviewUpload && onPreviewRemove && (
          <div className="shrink-0">
            <PreviewMediaCompact
              experienceId={experience.id}
              previewMediaUrl={previewMediaUrl}
              previewMediaType={previewMediaType}
              onUpload={onPreviewUpload}
              onRemove={onPreviewRemove}
              disabled={disabled}
            />
          </div>
        )}

        {/* Column 2: Title + Delete + Controls */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Row 1: Title & Actions */}
          <div className="flex items-start justify-between gap-4">
            <h2
              className="text-2xl font-semibold cursor-pointer hover:underline break-words inline-block"
              onClick={handleTitleClick}
            >
              {experience.name}
            </h2>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDuplicate}
                      disabled={disabled || isTitlePending || isEnabledPending || isDuplicatePending}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isDuplicatePending ? "Duplicating..." : "Duplicate experience"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DeleteExperienceButton
                experienceName={experience.name}
                onDelete={onDelete}
                disabled={disabled || isTitlePending || isEnabledPending || isDuplicatePending}
              />
            </div>
          </div>

          {/* Row 2: Toggle Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Enabled Toggle */}
            <TooltipProvider>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                  <Switch
                    id={`enabled-${experience.id}`}
                    checked={enabled}
                    onCheckedChange={handleEnabledChange}
                    disabled={disabled || isTitlePending || isEnabledPending}
                  />
                </div>
                <Label
                  htmlFor={`enabled-${experience.id}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {isEnabledPending ? "Updating..." : "Enabled"}
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{enabled ? "Guests can access this experience" : "Hidden from guests"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {additionalControls}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mt-6 mb-2" />

      {/* Title Edit Dialog */}
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Experience</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Experience name"
              maxLength={100}
              disabled={isTitlePending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isTitlePending) {
                  handleTitleSave();
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {titleInput.length}/100 characters
            </p>
            {titleError && (
              <p className="text-sm text-destructive mt-2">{titleError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTitleCancel}
              disabled={isTitlePending}
            >
              Cancel
            </Button>
            <Button onClick={handleTitleSave} disabled={isTitlePending}>
              {isTitlePending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
