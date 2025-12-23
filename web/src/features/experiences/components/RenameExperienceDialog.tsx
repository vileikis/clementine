"use client";

/**
 * Component: RenameExperienceDialog
 *
 * Dialog for renaming an experience.
 * Uses react-hook-form for form state and validation.
 * Auto-focuses the input field when opened.
 */

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateExperienceAction } from "../actions";
import type { Experience } from "../types";

const renameSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long").trim(),
});

type RenameFormData = z.infer<typeof renameSchema>;

interface RenameExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience: Experience;
}

export function RenameExperienceDialog({
  open,
  onOpenChange,
  experience,
}: RenameExperienceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setFocus,
  } = useForm<RenameFormData>({
    resolver: standardSchemaResolver(renameSchema),
    defaultValues: {
      name: experience.name,
    },
  });

  // Reset form when dialog opens or experience changes
  useEffect(() => {
    if (open) {
      reset({ name: experience.name });
      // Auto-focus after a short delay to ensure dialog is fully rendered
      setTimeout(() => {
        setFocus("name");
      }, 50);
    }
  }, [open, experience.name, reset, setFocus]);

  const onSubmit = useCallback(
    async (data: RenameFormData) => {
      // Don't submit if name hasn't changed
      if (data.name === experience.name) {
        onOpenChange(false);
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await updateExperienceAction(experience.id, {
          name: data.name,
        });

        if (result.success) {
          toast.success("Experience renamed");
          onOpenChange(false);
        } else {
          toast.error(result.error?.message ?? "Failed to rename experience");
        }
      } catch {
        toast.error("Failed to rename experience");
      } finally {
        setIsSubmitting(false);
      }
    },
    [experience.id, experience.name, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Rename Experience</DialogTitle>
            <DialogDescription>
              Enter a new name for this experience.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Experience name"
                disabled={isSubmitting}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
