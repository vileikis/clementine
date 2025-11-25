"use client";

import { useTransition } from "react";
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
import { toast } from "sonner";

interface DeleteJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyName: string;
  onDelete: () => Promise<void>;
}

/**
 * DeleteJourneyDialog - Confirmation dialog for deleting a journey
 * Mobile-first design with loading state
 */
export function DeleteJourneyDialog({
  open,
  onOpenChange,
  journeyName,
  onDelete,
}: DeleteJourneyDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await onDelete();
        onOpenChange(false);
        toast.success("Journey deleted");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete journey"
        );
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Journey?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{journeyName}&quot;? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-h-[44px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="min-h-[44px] bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
