"use client";

/**
 * Error Boundary for Experience Editor Page
 * Part of Phase 6 (Polish) - Error Handling for Schema Validation Failures
 *
 * Catches runtime errors during experience editing, including:
 * - Schema validation failures
 * - Firestore read/write errors
 * - Migration errors
 *
 * Provides user-friendly error UI with recovery options
 *
 * Route: /events/:eventId/design/experiences/:experienceId/error
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ExperienceEditorError({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console (in production, could send to error tracking service)
    console.error("Experience editor error:", error);
  }, [error]);

  // Detect specific error types
  const isValidationError = error.message.includes("validation") ||
                           error.message.includes("parse") ||
                           error.message.includes("schema");
  const isMigrationError = error.message.includes("migration");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isValidationError
              ? "Invalid Experience Data"
              : isMigrationError
              ? "Migration Failed"
              : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isValidationError
              ? "The experience data failed validation checks. This may be due to corrupted data or an incomplete migration."
              : isMigrationError
              ? "Unable to migrate legacy experience data to the new schema format. The data may be corrupted or missing required fields."
              : "An unexpected error occurred while loading the experience editor."}
          </p>
        </div>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left">
            <p className="text-xs font-mono text-red-900 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-700">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link href="/events">
              <Home className="h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          If this problem persists, try refreshing the page or{" "}
          <Link
            href="/events"
            className="underline hover:text-foreground"
          >
            return to the events list
          </Link>
          .
        </p>
      </div>
    </div>
  );
}