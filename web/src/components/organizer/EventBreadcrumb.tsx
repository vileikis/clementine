"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateEventTitleAction } from "@/app/actions/events";
import { useRouter } from "next/navigation";

interface EventBreadcrumbProps {
  eventId: string;
  eventName: string;
}

/**
 * Breadcrumb navigation showing "Events > [Event name]"
 * Event name is clickable to edit
 * Part of Phase 3 (User Story 0) - Base Events UI Navigation Shell
 */
export function EventBreadcrumb({ eventId, eventName }: EventBreadcrumbProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(eventName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateEventTitleAction(eventId, title);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to update event name");
      }
    });
  };

  const handleCancel = () => {
    setTitle(eventName);
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <nav>
        <ol className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <li>
            <Link
              href="/events"
              className="hover:text-foreground hover:underline transition-colors"
            >
              Events
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <button
              onClick={() => setIsOpen(true)}
              className="text-foreground font-medium truncate max-w-[150px] hover:underline cursor-pointer"
              title={`${eventName} (click to edit)`}
            >
              {eventName}
            </button>
          </li>
        </ol>
      </nav>

      {/* Edit event name dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this event</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
              maxLength={100}
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
