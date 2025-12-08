"use client";

/**
 * PropControls Component
 *
 * Form controls for testing CameraCapture component configurations.
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CameraFacingConfig, AspectRatio, CameraFacing } from "@/features/camera";

interface PropControlsProps {
  enableCamera: boolean;
  enableLibrary: boolean;
  cameraFacing: CameraFacingConfig;
  initialFacing: CameraFacing;
  aspectRatio: AspectRatio | "none";
  onEnableCameraChange: (value: boolean) => void;
  onEnableLibraryChange: (value: boolean) => void;
  onCameraFacingChange: (value: CameraFacingConfig) => void;
  onInitialFacingChange: (value: CameraFacing) => void;
  onAspectRatioChange: (value: AspectRatio | "none") => void;
  onReset: () => void;
}

export function PropControls({
  enableCamera,
  enableLibrary,
  cameraFacing,
  initialFacing,
  aspectRatio,
  onEnableCameraChange,
  onEnableLibraryChange,
  onCameraFacingChange,
  onInitialFacingChange,
  onAspectRatioChange,
  onReset,
}: PropControlsProps) {
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Props</h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset & Remount
        </Button>
      </div>

      {/* Boolean Props */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enableCamera">enableCamera</Label>
          <Switch
            id="enableCamera"
            checked={enableCamera}
            onCheckedChange={onEnableCameraChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="enableLibrary">enableLibrary</Label>
          <Switch
            id="enableLibrary"
            checked={enableLibrary}
            onCheckedChange={onEnableLibraryChange}
          />
        </div>
      </div>

      {/* Select Props */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cameraFacing">cameraFacing</Label>
          <Select value={cameraFacing} onValueChange={(v) => onCameraFacingChange(v as CameraFacingConfig)}>
            <SelectTrigger id="cameraFacing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">user (front)</SelectItem>
              <SelectItem value="environment">environment (back)</SelectItem>
              <SelectItem value="both">both (switchable)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialFacing">initialFacing</Label>
          <Select value={initialFacing} onValueChange={(v) => onInitialFacingChange(v as CameraFacing)}>
            <SelectTrigger id="initialFacing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">user (front)</SelectItem>
              <SelectItem value="environment">environment (back)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aspectRatio">aspectRatio</Label>
          <Select value={aspectRatio} onValueChange={(v) => onAspectRatioChange(v as AspectRatio | "none")}>
            <SelectTrigger id="aspectRatio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">none</SelectItem>
              <SelectItem value="3:4">3:4 (portrait)</SelectItem>
              <SelectItem value="1:1">1:1 (square)</SelectItem>
              <SelectItem value="9:16">9:16 (stories)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation Warning */}
      {!enableCamera && !enableLibrary && (
        <p className="text-sm text-destructive">
          Warning: Both camera and library are disabled. Enable at least one.
        </p>
      )}
    </div>
  );
}
