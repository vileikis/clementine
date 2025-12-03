"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectStatusSwitcher } from "./studio/ProjectStatusSwitcher";
import type { Project } from "../types/project.types";

interface ProjectDetailsHeaderProps {
  companySlug: string;
  project: Project;
  onRenameClick?: () => void;
}

/**
 * Project details page header.
 *
 * Features:
 * - Back arrow to projects list
 * - Clickable project name (opens rename dialog)
 * - Status switcher (draft/live/archived)
 * - Matches ExperienceEditorHeader pattern
 */
export function ProjectDetailsHeader({
  companySlug,
  project,
  onRenameClick,
}: ProjectDetailsHeaderProps) {
  // Filter out "deleted" status since projects can't be viewed if deleted
  const displayStatus = project.status === "deleted" ? "archived" : project.status;

  return (
    <header className="flex items-center gap-4 px-4 py-3 bg-background">
      {/* Back Button */}
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
        <Link href={`/${companySlug}/projects`}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to projects</span>
        </Link>
      </Button>

      {/* Project Name - Clickable to rename */}
      <div className="flex-1 min-w-0">
        <button
          onClick={onRenameClick}
          className="text-left hover:bg-accent px-2 py-1 -ml-2 rounded-md transition-colors"
        >
          <h1 className="text-base font-semibold truncate">{project.name}</h1>
          <p className="text-xs text-muted-foreground capitalize">
            {displayStatus}
          </p>
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 shrink-0">
        <ProjectStatusSwitcher
          projectId={project.id}
          currentStatus={displayStatus}
        />
      </div>
    </header>
  );
}
