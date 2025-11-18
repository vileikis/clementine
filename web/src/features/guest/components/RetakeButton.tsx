/**
 * RetakeButton Component
 *
 * Allows the guest to restart the capture flow and take a new photo.
 */

"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface RetakeButtonProps {
  onRetake: () => void;
  disabled?: boolean;
}

export function RetakeButton({ onRetake, disabled }: RetakeButtonProps) {
  return (
    <Button
      onClick={onRetake}
      disabled={disabled}
      variant="outline"
      className="w-full gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      Retake Photo
    </Button>
  );
}
