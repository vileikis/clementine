"use client";

/**
 * Delete Project Button with confirmation dialog.
 *
 * SAFETY: This component must NOT be added to Project Studio pages.
 * Delete functionality is intentionally restricted to the project list page only
 * to prevent accidental deletion while editing project details.
 */

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProjectAction } from "../../actions";
import { toast } from "sonner";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const companySlug = params.companySlug as string;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteProjectAction(projectId);
      if (result.success) {
        toast.success("Project deleted");
        setIsOpen(false);
        // Redirect to projects list
        router.push(`/${companySlug}/projects`);
      } else {
        toast.error(result.error?.message || "Failed to delete project");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete project</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{projectName}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
