/**
 * Experience Not Found Page
 * Part of Phase 5 (User Story 3) - View and Manage Experiences in Sidebar
 *
 * Displays when an invalid experience ID is accessed
 * Provides link back to design section
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExperienceNotFound() {
  return (
    <div className="container max-w-2xl py-16">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Experience Not Found
          </h1>
          <p className="text-muted-foreground">
            The experience you&apos;re looking for doesn&apos;t exist or has
            been deleted.
          </p>
        </div>

        {/* Action */}
        <div className="pt-4">
          <Button asChild className="min-h-[44px]">
            <Link href="../welcome">Back to Design</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}