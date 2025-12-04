"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ImageIcon, Trash2, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { EventExperienceLink } from "../../types/event.types";
import type { Experience } from "@/features/experiences";
import {
  updateEventExperienceAction,
  removeEventExperienceAction,
} from "../../actions";

interface EventExperienceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  eventId: string;
  experienceLink: EventExperienceLink | null;
  experience: Experience | null;
}

/**
 * Drawer for editing an attached experience's configuration (label).
 * Also provides remove functionality with confirmation.
 */
export function EventExperienceDrawer({
  open,
  onOpenChange,
  projectId,
  eventId,
  experienceLink,
  experience,
}: EventExperienceDrawerProps) {
  const params = useParams<{ companySlug: string }>();
  // Initialize label from experienceLink - the key on parent ensures this resets when experience changes
  const [label, setLabel] = useState(experienceLink?.label ?? "");
  const [isSaving, startSaveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const displayName = experienceLink?.label || experience?.name || "Unknown Experience";
  const hasLabelChanged = (label || null) !== (experienceLink?.label ?? null);

  const handleSave = () => {
    if (!experienceLink) return;

    startSaveTransition(async () => {
      const result = await updateEventExperienceAction({
        projectId,
        eventId,
        experienceId: experienceLink.experienceId,
        label: label || null,
      });

      if (result.success) {
        toast.success("Experience updated");
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleRemove = () => {
    if (!experienceLink) return;

    startRemoveTransition(async () => {
      const result = await removeEventExperienceAction({
        projectId,
        eventId,
        experienceId: experienceLink.experienceId,
      });

      if (result.success) {
        toast.success("Experience removed");
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setLabel("");
    }
    onOpenChange(newOpen);
  };

  const isLoading = isSaving || isRemoving;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Experience</SheetTitle>
          <SheetDescription>
            Configure how this experience appears in your event.
          </SheetDescription>
        </SheetHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {experienceLink && (
            <div className="space-y-6">
              {/* Experience preview */}
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {experience?.previewMediaUrl ? (
                    <Image
                      src={experience.previewMediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized={experience.previewType === "gif"}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">
                    {experience?.name ?? "Experience not found"}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {experience?.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Open in Editor button */}
              {experience && (
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link
                    href={`/${params.companySlug}/exps/${experienceLink.experienceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Editor
                  </Link>
                </Button>
              )}

              {/* Label input */}
              <div className="space-y-2">
                <Label htmlFor="edit-experience-label">Custom Label (optional)</Label>
                <Input
                  id="edit-experience-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={experience?.name ?? "Experience name"}
                  maxLength={200}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Override the display name for this event. Leave empty to use the
                  original experience name.
                </p>
              </div>

              {/* Remove section */}
              <div className="rounded-lg border border-destructive/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Remove Experience</h4>
                    <p className="text-xs text-muted-foreground">
                      Remove this experience from the event. Guests will no longer see it.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isLoading}
                        className="shrink-0"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove experience?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove &quot;{displayName}&quot; from this event.
                          Guests will no longer be able to select it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRemove}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isRemoving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with save button */}
        <SheetFooter>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasLabelChanged}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
