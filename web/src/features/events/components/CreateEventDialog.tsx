"use client";

/**
 * Component: CreateEventDialog
 *
 * Dialog for creating a new event.
 * Uses form for Enter key submission.
 * Auto-focuses the input field when opened.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventAction } from "../actions/events.actions";
import { DEFAULT_EVENT_NAME } from "../constants";

interface CreateEventDialogProps {
  projectId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CreateEventDialog({
  projectId,
  variant = "default",
  size = "default",
  className,
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(DEFAULT_EVENT_NAME);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(DEFAULT_EVENT_NAME);
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = name.trim();

      // Validation
      if (!trimmedName) {
        setError("Name is required");
        return;
      }
      if (trimmedName.length > 200) {
        setError("Name is too long");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await createEventAction({
          projectId,
          name: trimmedName,
        });

        if (result.success) {
          toast.success("Event created");
          setOpen(false);
        } else {
          setError(result.error?.message ?? "Failed to create event");
        }
      } catch {
        setError("Failed to create event");
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, projectId]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">New Event</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Create a new event for this project. Events can have their own
              theme and linked experiences.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Name</Label>
              <Input
                id="event-name"
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
