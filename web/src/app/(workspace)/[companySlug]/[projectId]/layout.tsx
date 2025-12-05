"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/features/projects/hooks/useProject";
import {
  ProjectDetailsHeader,
  RenameProjectDialog,
} from "@/features/projects/components";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for project details pages with header and tab navigation.
 * Wraps Events, Distribute, and nested event pages.
 *
 * Project header with tabs remains visible even when viewing nested event routes.
 */
export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const projectId = params.projectId as string;
  const companySlug = params.companySlug as string;

  const { project, loading, error } = useProject(projectId);

  // Rename dialog state
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error?.message || "Project not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back arrow, project name, status, and tabs */}
      <ProjectDetailsHeader
        companySlug={companySlug}
        project={project}
        projectId={projectId}
        onRenameClick={() => setIsRenameOpen(true)}
      />

      {/* Content with max-width container */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">{children}</div>
      </div>

      {/* Rename Dialog */}
      <RenameProjectDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        project={project}
      />
    </div>
  );
}
