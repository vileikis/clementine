"use client";

/**
 * Component: ProjectList
 *
 * Displays a grid of projects for a company.
 * Shows empty state if no projects exist.
 * Includes header with create button.
 */

import { Loader2 } from "lucide-react";
import { ProjectCard } from "./studio/ProjectCard";
import { EmptyProjects } from "./EmptyProjects";
import { CreateProjectButton } from "./CreateProjectButton";
import { useProjects } from "../hooks/useProjects";

interface ProjectListProps {
  companyId: string;
  companySlug: string;
}

export function ProjectList({ companyId, companySlug }: ProjectListProps) {
  const { projects, loading, error } = useProjects({ companyId });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-destructive mb-2">Failed to load projects</p>
        <p className="text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyProjects companyId={companyId} companySlug={companySlug} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <CreateProjectButton companyId={companyId} companySlug={companySlug} />
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} companyName={null} />
        ))}
      </div>
    </div>
  );
}
