"use client"

import { ProjectStatusSwitcher } from "./studio/ProjectStatusSwitcher"
import { EditableProjectName } from "./shared/EditableProjectName"
import type { Project } from "../types/project.types"

interface ProjectDetailsHeaderProps {
  project: Project
}

/**
 * Project details page header with editable name and status switcher.
 *
 * Features:
 * - Editable project name (click to edit)
 * - Status switcher (draft/live/archived)
 * - Clean, mobile-first layout
 */
export function ProjectDetailsHeader({ project }: ProjectDetailsHeaderProps) {
  // Filter out "deleted" status since projects can't be viewed if deleted
  const displayStatus = project.status === "deleted" ? "archived" : project.status

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b">
      <div className="flex-1">
        <EditableProjectName
          projectId={project.id}
          currentName={project.name}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ProjectStatusSwitcher
          projectId={project.id}
          currentStatus={displayStatus}
        />
      </div>
    </div>
  )
}
