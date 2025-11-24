"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCompanyAction } from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteCompanyDialogProps {
  companyId: string;
  companyName: string;
  eventCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCompanyDialog({
  companyId,
  companyName,
  eventCount,
  open,
  onOpenChange,
}: DeleteCompanyDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteCompanyAction(companyId);

      if (result.success) {
        // Close dialog and navigate to companies list
        onOpenChange(false);
        router.push("/companies");
        router.refresh();
      } else {
        setError(result.error || "Failed to delete company");
        setIsDeleting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{companyName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning about events */}
        {eventCount > 0 && (
          <div className="rounded-md bg-yellow-50 p-4 text-sm border border-yellow-200">
            <p className="font-medium text-yellow-800">
              ⚠️ This company has {eventCount}{" "}
              {eventCount === 1 ? "event" : "events"}
            </p>
            <p className="text-yellow-700 mt-1">
              Events will remain in the system, but guest links for this
              company&apos;s events will be disabled.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Company"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
