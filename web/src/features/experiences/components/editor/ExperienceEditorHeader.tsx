"use client";

/**
 * Component: ExperienceEditorHeader
 *
 * Top header bar for the experience editor.
 * Shows experience name (clickable to rename), navigation back to experiences list, and Play Experience button.
 */

import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Experience } from "../../types";
import { ExperienceTabs } from "./ExperienceTabs";

interface ExperienceEditorHeaderProps {
  companySlug: string;
  experience: Experience;
  onPlayClick?: () => void;
  onRenameClick?: () => void;
}

export function ExperienceEditorHeader({
  companySlug,
  experience,
  onPlayClick,
  onRenameClick,
}: ExperienceEditorHeaderProps) {
  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
      {/* Back Button */}
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
        <Link href={`/${companySlug}/exps`}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to experiences</span>
        </Link>
      </Button>

      {/* Experience Name - Clickable to rename */}
      <div className="min-w-20">
        <button
          onClick={onRenameClick}
          className="text-left hover:bg-accent px-2 py-1 -ml-2 rounded-md transition-colors"
        >
          <h1 className="text-base font-semibold truncate">{experience.name}</h1>
          <p className="text-xs text-muted-foreground">
            {experience.stepsOrder.length} step{experience.stepsOrder.length !== 1 ? "s" : ""}
          </p>
        </button>
      </div>

      <div className="flex-1">
        <ExperienceTabs companySlug={companySlug} experienceId={experience.id} />
      </div>


      {/* Play Experience Button */}
      {onPlayClick && (
        <Button
          variant="default"
          size="sm"
          onClick={onPlayClick}
          className="gap-1.5 shrink-0"
        >
          <Play className="h-4 w-4" />
          <span className="hidden sm:inline">Play Experience</span>
          <span className="sm:hidden">Play</span>
        </Button>
      )}
    </header>
  );
}
