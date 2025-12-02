"use client";

/**
 * Component: DeleteExperienceDialog
 *
 * Confirmation dialog for deleting (soft delete) an experience.
 * Shows the experience name and warns about the action.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteExperienceAction } from "../actions";
import type { Experience } from "../types";

interface DeleteExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience: Experience;
  onDeleted?: () => void;
}

export function DeleteExperienceDialog({
  open,
  onOpenChange,
  experience,
  onDeleted,
}: DeleteExperienceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteExperienceAction(experience.id);

      if (result.success) {
        toast.success("Experience deleted");
        onOpenChange(false);
        onDeleted?.();
      } else {
        toast.error(result.error?.message ?? "Failed to delete experience");
      }
    } catch {
      toast.error("Failed to delete experience");
    } finally {
      setIsDeleting(false);
    }
  }, [experience.id, onOpenChange, onDeleted]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete experience?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete &ldquo;{experience.name}&rdquo; and all its steps.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
