"use client";

/**
 * Delete Event Button with confirmation dialog.
 *
 * SAFETY: This component must NOT be added to Event Studio pages.
 * Delete functionality is intentionally restricted to the event list page only
 * to prevent accidental deletion while editing event details.
 */

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteEventAction } from "../../actions";
import { toast } from "sonner";

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
}

export function DeleteEventButton({ eventId, eventName }: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteEventAction(eventId);
      if (result.success) {
        toast.success("Event deleted");
        setIsOpen(false);
      } else {
        toast.error(result.error?.message || "Failed to delete event");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete event</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{eventName}&quot;?
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
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
