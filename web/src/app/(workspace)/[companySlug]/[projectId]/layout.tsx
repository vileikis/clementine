"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
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
 * Wraps Events, Distribute, and Results pages.
 */
export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
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

  const tabs = [
    { name: "Events", href: `/${companySlug}/${projectId}/events` },
    { name: "Distribute", href: `/${companySlug}/${projectId}/distribute` },
  ];

  // Determine active tab from pathname
  const activeTab = pathname?.includes("/distribute")
    ? "Distribute"
    : pathname?.includes("/results")
      ? "Results"
      : "Events";

  return (
    <div className="flex flex-col h-full">
      {/* Header with back arrow, project name, and status */}
      <ProjectDetailsHeader
        companySlug={companySlug}
        project={project}
        onRenameClick={() => setIsRenameOpen(true)}
      />

      {/* Tab Navigation */}
      <div className="border-b px-4">
        <nav className="flex gap-6" aria-label="Project tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.name;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Rename Dialog */}
      <RenameProjectDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        project={project}
      />
    </div>
  );
}
