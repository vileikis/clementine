"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Event } from "../types/event.types";
import { RenameEventDialog } from "./RenameEventDialog";
import { DeleteEventDialog } from "./DeleteEventDialog";
import { setActiveEventAction } from "../actions/events.actions";
import { toast } from "sonner";

interface EventCardProps {
  event: Event;
  isActive: boolean;
}

export function EventCard({ event, isActive }: EventCardProps) {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const projectId = params.projectId as string;

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);

  const formattedDate = new Date(event.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleSetActive = async () => {
    if (isActive || isSettingActive) return;

    setIsSettingActive(true);
    try {
      const result = await setActiveEventAction(projectId, event.id);
      if (result.success) {
        toast.success("Event set as active");
      } else {
        toast.error(result.error.message || "Failed to set active event");
      }
    } catch {
      toast.error("Failed to set active event");
    } finally {
      setIsSettingActive(false);
    }
  };

  return (
    <>
      <div
        className={`relative block border rounded-lg p-6 hover:border-primary transition-colors ${
          isActive ? "border-primary bg-primary/5" : ""
        }`}
      >
        <Link
          href={`/${companySlug}/${projectId}/${event.id}`}
          className="absolute inset-0 rounded-lg"
        >
          <span className="sr-only">View {event.name}</span>
        </Link>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold truncate">{event.name}</h3>
              {isActive && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  Active
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Event menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive();
                  }}
                  disabled={isActive || isSettingActive}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {isActive ? "Already Active" : "Set as Active"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenameOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: event.theme.primaryColor }}
            />
            <span>{event.theme.primaryColor}</span>
          </div>

          <div className="text-xs">Last updated {formattedDate}</div>
        </div>
      </div>

      {/* Dialogs rendered outside the card */}
      <RenameEventDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        event={event}
        projectId={projectId}
      />
      <DeleteEventDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        event={event}
        projectId={projectId}
      />
    </>
  );
}
