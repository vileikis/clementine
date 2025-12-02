"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, FolderOpen } from "lucide-react"
import { useProjects } from "@/features/projects/hooks/useProjects"
import { ProjectCard } from "@/features/projects/components/studio/ProjectCard"
import { ProjectForm } from "@/features/projects/components/studio/ProjectForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Projects list page with grid of project cards and create button.
 * Shows empty state when no projects exist.
 */
export default function ProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const companySlug = params.companySlug as string
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // TODO: Get actual companyId from company context/hook
  // For now, using companySlug as placeholder
  const { projects, loading, error } = useProjects({ companyId: companySlug })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || "Failed to load projects"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your campaigns and events
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed rounded-lg">
          <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Create your first project to start building engaging AI-powered photo
            booth experiences.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              companyName={null}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSuccess={(projectId) => {
              setIsCreateDialogOpen(false)
              router.push(`/${companySlug}/${projectId}`)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
