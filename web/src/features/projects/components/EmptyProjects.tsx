"use client";

/**
 * Component: EmptyProjects
 *
 * Empty state shown when a company has no projects.
 * Includes a prompt to create the first project.
 */

import { FolderOpen } from "lucide-react";
import { CreateProjectButton } from "./CreateProjectButton";

interface EmptyProjectsProps {
  companyId: string;
  companySlug: string;
}

export function EmptyProjects({ companyId, companySlug }: EmptyProjectsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <FolderOpen className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Create your first project to start organizing your campaigns and events.
      </p>
      <CreateProjectButton
        companyId={companyId}
        companySlug={companySlug}
        size="lg"
      />
    </div>
  );
}
