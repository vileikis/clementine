"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import { Loader2, ArrowLeft, ImageIcon, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useExperiences } from "@/features/experiences";
import type { Experience } from "@/features/experiences";
import type {
  EventExperienceLink,
  ExtraSlotFrequency,
} from "../../types/event.types";
import {
  setEventExtraAction,
  updateEventExtraAction,
  removeEventExtraAction,
} from "../../actions";
import { EXTRA_SLOTS, EXTRA_FREQUENCIES } from "../../constants";

type ExtraSlotKey = keyof typeof EXTRA_SLOTS;

interface ExtraSlotDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  eventId: string;
  companyId: string;
  slotKey: ExtraSlotKey;
  experienceLink: EventExperienceLink | null | undefined;
  experience: Experience | null;
}

/**
 * Drawer for configuring an extra slot.
 * Two modes:
 * 1. Add mode (empty slot): Select experience → Configure frequency/label → Save
 * 2. Edit mode (configured slot): Edit label/frequency, remove option
 */
export function ExtraSlotDrawer({
  open,
  onOpenChange,
  projectId,
  eventId,
  companyId,
  slotKey,
  experienceLink,
  experience,
}: ExtraSlotDrawerProps) {
  const slotConfig = EXTRA_SLOTS[slotKey];
  const isEditMode = !!experienceLink;

  // Add mode state
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  // Form state (used in both modes) - initialized from props, key on parent handles remounting
  const [label, setLabel] = useState(experienceLink?.label ?? "");
  const [frequency, setFrequency] = useState<ExtraSlotFrequency>(experienceLink?.frequency ?? "always");

  // Loading states
  const [isSaving, startSaveTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  // Fetch company experiences for selection
  const { experiences, loading: loadingExperiences } = useExperiences(companyId);

  // Filter to only show experiences not already used in extras
  const availableExperiences = useMemo(() => experiences, [experiences]);

  const handleSelectExperience = (exp: Experience) => {
    setSelectedExperience(exp);
    setLabel(""); // Reset label when selecting new experience
  };

  const handleBack = () => {
    setSelectedExperience(null);
    setLabel("");
    setFrequency("always");
  };

  const handleSaveNew = () => {
    if (!selectedExperience) return;

    startSaveTransition(async () => {
      const result = await setEventExtraAction({
        projectId,
        eventId,
        slot: slotKey,
        experienceId: selectedExperience.id,
        label: label || null,
        enabled: true,
        frequency,
      });

      if (result.success) {
        toast.success(`${slotConfig.label} configured`);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleSaveEdit = () => {
    if (!experienceLink) return;

    startSaveTransition(async () => {
      const result = await updateEventExtraAction({
        projectId,
        eventId,
        slot: slotKey,
        label: label || null,
        frequency,
      });

      if (result.success) {
        toast.success(`${slotConfig.label} updated`);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleRemove = () => {
    startRemoveTransition(async () => {
      const result = await removeEventExtraAction({
        projectId,
        eventId,
        slot: slotKey,
      });

      if (result.success) {
        toast.success(`${slotConfig.label} removed`);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedExperience(null);
      setLabel("");
      setFrequency("always");
    }
    onOpenChange(newOpen);
  };

  const isLoading = isSaving || isRemoving;

  // Check if there are changes in edit mode
  const hasEditChanges =
    isEditMode &&
    experienceLink &&
    ((label || null) !== (experienceLink.label ?? null) ||
      frequency !== (experienceLink.frequency ?? "always"));

  // Determine which experience to show in configuration view
  const configExperience = isEditMode ? experience : selectedExperience;

  // Show configuration form?
  const showConfigForm = isEditMode || selectedExperience;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          {showConfigForm ? (
            <>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleBack}
                    className="-ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <SheetTitle>
                  {isEditMode ? `Edit ${slotConfig.label}` : `Add ${slotConfig.label}`}
                </SheetTitle>
              </div>
              <SheetDescription>
                {isEditMode
                  ? "Update the configuration for this extra slot."
                  : "Configure how this experience runs before guests proceed."}
              </SheetDescription>
            </>
          ) : (
            <>
              <SheetTitle>Select Experience</SheetTitle>
              <SheetDescription>
                Choose an experience for the {slotConfig.label.toLowerCase()} slot.
              </SheetDescription>
            </>
          )}
        </SheetHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {showConfigForm ? (
            // Configuration form
            <div className="space-y-6">
              {/* Experience preview */}
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {configExperience?.previewMediaUrl ? (
                    <Image
                      src={configExperience.previewMediaUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized={configExperience.previewType === "gif"}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">
                    {configExperience?.name ?? "Experience not found"}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {configExperience?.description || "No description"}
                  </p>
                </div>
              </div>

              {/* Frequency select */}
              <div className="space-y-2">
                <Label htmlFor="extra-frequency">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) =>
                    setFrequency(value as ExtraSlotFrequency)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="extra-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EXTRA_FREQUENCIES).map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        <div>
                          <div className="font-medium">{freq.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {freq.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How often should this experience be shown to guests?
                </p>
              </div>

              {/* Label input */}
              <div className="space-y-2">
                <Label htmlFor="extra-label">Custom Label (optional)</Label>
                <Input
                  id="extra-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={configExperience?.name ?? "Experience name"}
                  maxLength={200}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Override the display name for this slot. Leave empty to use the
                  original experience name.
                </p>
              </div>

              {/* Remove section (edit mode only) */}
              {isEditMode && (
                <div className="rounded-lg border border-destructive/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Remove {slotConfig.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        Clear this slot. Guests will skip this step.
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
                          <AlertDialogTitle>Remove {slotConfig.label}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear the {slotConfig.label.toLowerCase()} slot.
                            Guests will no longer see this step.
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
              )}
            </div>
          ) : loadingExperiences ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableExperiences.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">No experiences available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an experience in your library first.
              </p>
            </div>
          ) : (
            // Experience list
            <div className="space-y-2">
              {availableExperiences.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => handleSelectExperience(exp)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-4",
                    "text-left transition-colors",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {exp.previewMediaUrl ? (
                      <Image
                        src={exp.previewMediaUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized={exp.previewType === "gif"}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{exp.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {exp.description || "No description"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with action button */}
        {showConfigForm && (
          <SheetFooter>
            <Button
              onClick={isEditMode ? handleSaveEdit : handleSaveNew}
              disabled={isLoading || (isEditMode && !hasEditChanges)}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                `Add ${slotConfig.label}`
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
