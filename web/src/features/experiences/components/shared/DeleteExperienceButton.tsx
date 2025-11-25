"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteExperienceButtonProps {
  experienceName: string;
  onDelete: () => Promise<void>;
  disabled?: boolean;
}

/**
 * DeleteExperienceButton - Shared component for deleting experiences
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Provides a consistent delete flow for all experience types:
 * - Delete button with trash icon
 * - Confirmation dialog with experience name
 * - Loading state during deletion
 * - Success/error toast notifications
 *
 * Used by: PhotoExperienceEditor, GifExperienceEditor, VideoExperienceEditor, etc.
 */
export function DeleteExperienceButton({
  experienceName,
  onDelete,
  disabled,
}: DeleteExperienceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await onDelete();
        setShowDialog(false);
        toast.success("Experience deleted successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete experience"
        );
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={disabled || isPending}
        className="min-h-[44px] min-w-[44px]"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{experienceName}&quot;? This
              action cannot be undone.
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
    </>
  );
}
