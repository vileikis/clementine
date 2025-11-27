'use client';

import { CameraOff, RotateCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraPermissionDeniedProps {
  onRequestAgain: () => void;
  onUploadFallback: () => void;
}

export function CameraPermissionDenied({
  onRequestAgain,
  onUploadFallback,
}: CameraPermissionDeniedProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6 p-6 text-center">
      <div className="rounded-full bg-muted p-6">
        <CameraOff className="h-16 w-16 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Camera Access Needed</h3>
        <p className="text-sm text-muted-foreground">
          We need your permission to use the camera for this experience.
        </p>
      </div>

      <div className="space-y-3 text-left text-sm text-muted-foreground">
        <p className="font-medium">To enable camera access:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Click the lock icon in your browser&apos;s address bar</li>
          <li>Find &quot;Camera&quot; in the permissions list</li>
          <li>Select &quot;Allow&quot; and refresh the page</li>
        </ol>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button onClick={onRequestAgain} size="lg" className="w-full gap-2">
          <RotateCw className="h-5 w-5" />
          Request Permission Again
        </Button>

        <Button
          onClick={onUploadFallback}
          variant="outline"
          size="lg"
          className="w-full gap-2"
        >
          <Upload className="h-5 w-5" />
          Upload Photo Instead
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Don&apos;t worry, your camera is only used when you take a photo.
      </p>
    </div>
  );
}
