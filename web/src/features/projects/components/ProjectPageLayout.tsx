"use client";

/**
 * Component: ProjectPageLayout
 *
 * Shared layout for project sub-pages (events, distribute, etc.).
 * Provides the header with rename dialog and wraps page content.
 */

import { useState } from "react";
import { ProjectDetailsHeader } from "./ProjectDetailsHeader";
import { RenameProjectDialog } from "./RenameProjectDialog";
import { useProject } from "../hooks/useProject";
import type { Project } from "../types/project.types";

interface ProjectPageLayoutProps {
  companySlug: string;
  initialProject: Project;
  children: React.ReactNode;
}

export function ProjectPageLayout({
  companySlug,
  initialProject,
  children,
}: ProjectPageLayoutProps) {
  // Subscribe to real-time project updates
  const { project: liveProject } = useProject(initialProject.id);

  // Use live project if available, otherwise fall back to initial
  const project = liveProject ?? initialProject;

  // Rename dialog state
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const handleRenameClick = () => {
    setIsRenameOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <ProjectDetailsHeader
        companySlug={companySlug}
        project={project}
        onRenameClick={handleRenameClick}
      />

      <div className="flex-1 overflow-auto">{children}</div>

      <RenameProjectDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        project={project}
      />
    </div>
  );
}
