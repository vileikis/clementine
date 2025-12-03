"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import type { Project } from "../../types/project.types"
import { DeleteProjectButton } from "./DeleteProjectButton"

interface ProjectCardProps {
  project: Project
  companyName?: string | null
}

const statusStyles: Record<Project["status"], string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  live: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
  deleted: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels: Record<Project["status"], string> = {
  draft: "Draft",
  live: "Live",
  archived: "Archived",
  deleted: "Deleted",
}

export function ProjectCard({ project, companyName }: ProjectCardProps) {
  const params = useParams()
  const companySlug = params.companySlug as string

  const formattedDate = new Date(project.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="relative block border rounded-lg p-6 hover:border-primary transition-colors">
      <Link
        href={`/${companySlug}/projects/${project.id}`}
        className="absolute inset-0 rounded-lg"
      >
        <span className="sr-only">View {project.name}</span>
      </Link>

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          {companyName && (
            <p className="text-sm text-muted-foreground mt-1">
              {companyName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border flex-shrink-0 ${statusStyles[project.status]}`}
          >
            {statusLabels[project.status]}
          </span>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: project.theme.primaryColor }}
          />
          <span>{project.theme.primaryColor}</span>
        </div>

        <div className="text-xs">Last updated {formattedDate}</div>
      </div>
    </div>
  )
}
