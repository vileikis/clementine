"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProjectNameAction } from "../../actions/projects.actions";
import { useRouter } from "next/navigation";

interface ProjectBreadcrumbProps {
  projectId: string;
  projectName: string;
}

/**
 * Breadcrumb navigation showing "Projects > [Project name]"
 * Project name is clickable to edit
 */
export function ProjectBreadcrumb({ projectId, projectName }: ProjectBreadcrumbProps) {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateProjectNameAction(projectId, name);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error?.message || "Failed to update project name");
      }
    });
  };

  const handleCancel = () => {
    setName(projectName);
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <nav>
        <ol className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <li>
            <Link
              href={`/${companySlug}/projects`}
              className="hover:text-foreground hover:underline transition-colors"
            >
              Projects
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li>
            <button
              onClick={() => setIsOpen(true)}
              className="text-foreground font-medium truncate max-w-[150px] hover:underline cursor-pointer"
              title={`${projectName} (click to edit)`}
            >
              {projectName}
            </button>
          </li>
        </ol>
      </nav>

      {/* Edit project name dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename this project</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              maxLength={200}
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
