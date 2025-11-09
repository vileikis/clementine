/**
 * ResultViewer Component
 *
 * Displays the AI-transformed result image with loading and error states.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/types/firestore";

interface ResultViewerProps {
  session: Session;
  resultImageUrl?: string;
}

export function ResultViewer({ session, resultImageUrl }: ResultViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Show loading skeleton while transforming
  if (session.state === "transforming") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="aspect-[3/4] w-full max-w-md rounded-lg" />
        <div className="text-center">
          <p className="text-lg font-medium">Creating your AI photo...</p>
          <p className="text-sm text-muted-foreground">This may take up to 60 seconds</p>
        </div>
      </div>
    );
  }

  // Show error state if transform failed
  if (session.state === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive bg-destructive/10 p-8">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Transform Failed</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {session.error || "An error occurred while processing your photo"}
          </p>
        </div>
      </div>
    );
  }

  // Show result image when ready
  if (session.state === "ready" && resultImageUrl) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-lg">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 h-full w-full" />
          )}
          <Image
            src={resultImageUrl}
            alt="AI transformed result"
            fill
            className="object-cover"
            onLoad={() => setImageLoaded(true)}
            priority
          />
        </div>
        <p className="text-sm text-muted-foreground">Your AI-enhanced photo is ready!</p>
      </div>
    );
  }

  // Fallback: session state doesn't match expected
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">No result available</p>
    </div>
  );
}
