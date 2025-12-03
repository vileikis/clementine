"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/features/projects/hooks/useProject";
import { ProjectDistributeTab } from "@/features/projects/components";

/**
 * Project distribute page
 * Layout handled by parent layout.tsx
 */
export default function DistributePage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, loading, error } = useProject(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {error?.message || "Project not found"}
          </p>
        </div>
      </div>
    );
  }

  return <ProjectDistributeTab project={project} />;
}
