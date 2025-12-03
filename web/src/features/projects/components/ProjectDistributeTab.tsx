"use client";

import { QRPanel } from "@/features/distribution";
import type { Project } from "../types/project.types";

interface ProjectDistributeTabProps {
  project: Project;
}

/**
 * Project Distribute Tab component.
 *
 * Wraps the shared QRPanel component from the distribution module
 * to display share link and QR code for a project.
 *
 * @param project - The project to display distribution info for
 */
export function ProjectDistributeTab({ project }: ProjectDistributeTabProps) {
  // Build the full share URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${project.sharePath}`
      : project.sharePath;

  return (
    <div className="p-4 md:p-6">
      <QRPanel
        projectId={project.id}
        shareUrl={shareUrl}
        qrPngPath={project.qrPngPath}
      />
    </div>
  );
}
