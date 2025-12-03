"use client";

/**
 * Delete Event Dialog with confirmation.
 *
 * If the event is the active event for the project,
 * warns the user and clears activeEventId upon deletion.
 */

import { useState } from "react";
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
import { deleteEventAction } from "../actions/events.actions";
import { toast } from "sonner";
import type { Event } from "../types/event.types";

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  projectId: string;
  isActive?: boolean;
}

export function DeleteEventDialog({
  open,
  onOpenChange,
  event,
  projectId,
  isActive = false,
}: DeleteEventDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteEventAction(projectId, event.id);
      if (result.success) {
        toast.success("Event deleted");
        onOpenChange(false);
      } else {
        toast.error(result.error?.message || "Failed to delete event");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Event</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{event.name}&quot;?
            {isActive && (
              <span className="block mt-2 font-medium text-amber-600">
                This is the active event for this project. Deleting it will
                deactivate guest access until another event is set as active.
              </span>
            )}
            <span className="block mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
