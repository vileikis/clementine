"use client";

/**
 * Component: JourneyEditorHeader
 *
 * Top header bar for the journey editor.
 * Shows journey name and navigation back to journeys list.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Journey } from "../../types";

interface JourneyEditorHeaderProps {
  eventId: string;
  journey: Journey;
}

export function JourneyEditorHeader({
  eventId,
  journey,
}: JourneyEditorHeaderProps) {
  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
      {/* Back Button */}
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
        <Link href={`/events/${eventId}/journeys`}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to journeys</span>
        </Link>
      </Button>

      {/* Journey Name */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{journey.name}</h1>
        <p className="text-xs text-muted-foreground">
          {journey.stepOrder.length} step{journey.stepOrder.length !== 1 ? "s" : ""}
        </p>
      </div>
    </header>
  );
}
