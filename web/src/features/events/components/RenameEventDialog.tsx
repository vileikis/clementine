"use client";

/**
 * Component: RenameEventDialog
 *
 * Dialog for renaming an event.
 * Uses form for Enter key submission.
 * Auto-focuses the input field when opened.
 */

import { useEffect, useState, useCallback } from "react";
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
import { updateEventAction } from "../actions/events.actions";
import { NAME_LENGTH } from "../constants";
import type { Event } from "../types/event.types";

interface RenameEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  projectId: string;
}

export function RenameEventDialog({
  open,
  onOpenChange,
  event,
  projectId,
}: RenameEventDialogProps) {
  const [name, setName] = useState(event.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or event changes
  useEffect(() => {
    if (open) {
      setName(event.name);
      setError(null);
    }
  }, [open, event.name]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = name.trim();

      // Validation
      if (!trimmedName) {
        setError("Name is required");
        return;
      }
      if (trimmedName.length > NAME_LENGTH.MAX) {
        setError("Name is too long");
        return;
      }

      // Don't submit if name hasn't changed
      if (trimmedName === event.name) {
        onOpenChange(false);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await updateEventAction(projectId, event.id, {
          name: trimmedName,
        });

        if (result.success) {
          toast.success("Event renamed");
          onOpenChange(false);
        } else {
          setError(result.error?.message ?? "Failed to rename event");
        }
      } catch {
        setError("Failed to rename event");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, event.id, event.name, projectId, onOpenChange]
  );

  const isDirty = name.trim() !== event.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Event</DialogTitle>
            <DialogDescription>
              Enter a new name for this event.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Event name"
                disabled={isSubmitting}
                maxLength={200}
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
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
