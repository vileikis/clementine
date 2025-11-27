'use client';

import { AlertTriangle } from 'lucide-react';

interface EventUnavailableScreenProps {
  message?: string;
  showContactSupport?: boolean;
}

export function EventUnavailableScreen({
  message = 'This event is no longer available',
  showContactSupport = true,
}: EventUnavailableScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 text-center shadow-lg">
        <div className="flex justify-center">
          <div className="rounded-full bg-warning/10 p-4">
            <AlertTriangle className="h-12 w-12 text-warning" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Event Unavailable
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>This could happen if:</p>
          <ul className="list-inside list-disc space-y-1 text-left">
            <li>The event has ended</li>
            <li>The event has been removed</li>
            <li>The link is incorrect</li>
          </ul>
        </div>

        {showContactSupport && (
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              If you believe this is a mistake, please contact the event
              organizer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
