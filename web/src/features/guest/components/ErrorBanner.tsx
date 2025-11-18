/**
 * ErrorBanner Component
 *
 * Displays error messages with retry options in the guest flow.
 */

"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ErrorBanner({ message, onRetry, onClose }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-lg border border-destructive bg-destructive/10 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold text-destructive">
            Something went wrong
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="flex gap-4">
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Start Over
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
