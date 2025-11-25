"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createJourneyAction } from "../actions/journeys";
import { JOURNEY_CONSTRAINTS } from "../constants";

interface CreateJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

/**
 * CreateJourneyDialog - Form dialog for creating a new journey
 * Mobile-first design with validation feedback
 */
export function CreateJourneyDialog({
  open,
  onOpenChange,
  eventId,
}: CreateJourneyDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Journey name is required");
      return;
    }
    if (trimmedName.length > JOURNEY_CONSTRAINTS.NAME_LENGTH.max) {
      setError("Journey name is too long");
      return;
    }

    startTransition(async () => {
      const result = await createJourneyAction({
        eventId,
        name: trimmedName,
      });

      if (result.success) {
        // Reset form
        setName("");
        onOpenChange(false);
        // Navigate to new journey detail
        router.push(`/events/${eventId}/journeys/${result.data.journeyId}`);
      } else {
        setError(result.error.message);
        toast.error(result.error.message);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form on close
      setName("");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Journey</DialogTitle>
            <DialogDescription>
              Give your journey a name to get started. You can add steps and
              configure it later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="journey-name" className="text-sm font-medium">
              Journey Name
            </Label>
            <Input
              id="journey-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g., Evening Party Flow"
              className="mt-2 min-h-[44px]"
              disabled={isPending}
              autoFocus
              maxLength={JOURNEY_CONSTRAINTS.NAME_LENGTH.max}
            />
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="min-h-[44px]"
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
