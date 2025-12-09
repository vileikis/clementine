"use client";

/**
 * Camera Dev Tools Page
 *
 * Interactive playground for testing CameraCapture component.
 */

import { useState, useCallback } from "react";
import {
  CameraCapture,
  type CapturedPhoto,
  type CameraCaptureError,
  type CameraFacingConfig,
  type AspectRatio,
  type CameraFacing,
} from "@/features/camera";
import { PropControls } from "./PropControls";
import { CallbackLog, type LogEntry } from "./CallbackLog";

export default function CameraDevToolsPage() {
  // Component key for forcing remount
  const [componentKey, setComponentKey] = useState(0);

  // Prop state
  const [enableLibrary, setEnableLibrary] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<CameraFacingConfig>("both");
  const [initialFacing, setInitialFacing] = useState<CameraFacing>("user");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | "none">("none");

  // Callback log state
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const addLogEntry = useCallback((callback: string, payload: unknown) => {
    setLogEntries((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        callback,
        payload,
      },
      ...prev,
    ]);
  }, []);

  // Callback handlers
  const handlePhoto = useCallback(
    (photo: CapturedPhoto) => {
      addLogEntry("onPhoto", photo);
    },
    [addLogEntry]
  );

  const handleSubmit = useCallback(
    (photo: CapturedPhoto) => {
      addLogEntry("onSubmit", photo);
      // Clean up object URL after logging
      URL.revokeObjectURL(photo.previewUrl);
    },
    [addLogEntry]
  );

  const handleRetake = useCallback(() => {
    addLogEntry("onRetake", undefined);
  }, [addLogEntry]);

  const handleCancel = useCallback(() => {
    addLogEntry("onCancel", undefined);
  }, [addLogEntry]);

  const handleError = useCallback(
    (error: CameraCaptureError) => {
      addLogEntry("onError", error);
    },
    [addLogEntry]
  );

  // Reset handler
  const handleReset = useCallback(() => {
    setComponentKey((k) => k + 1);
    setLogEntries([]);
  }, []);

  const handleClearLog = useCallback(() => {
    setLogEntries([]);
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Camera Component</h2>
        <p className="text-muted-foreground">
          Test the CameraCapture component with different configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prop Controls */}
        <div className="lg:col-span-1">
          <PropControls
            enableLibrary={enableLibrary}
            cameraFacing={cameraFacing}
            initialFacing={initialFacing}
            aspectRatio={aspectRatio}
            onEnableLibraryChange={setEnableLibrary}
            onCameraFacingChange={setCameraFacing}
            onInitialFacingChange={setInitialFacing}
            onAspectRatioChange={setAspectRatio}
            onReset={handleReset}
          />
        </div>

        {/* Camera Preview */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Preview</h3>
              <p className="text-xs text-muted-foreground">
                Mobile viewport (375x667px)
              </p>
            </div>
            {/* Mobile-sized container */}
            <div
              className="mx-auto bg-black"
              style={{
                width: "375px",
                height: "667px",
                maxWidth: "100%",
              }}
            >
              <CameraCapture
                key={componentKey}
                enableLibrary={enableLibrary}
                cameraFacing={cameraFacing}
                initialFacing={initialFacing}
                aspectRatio={aspectRatio === "none" ? undefined : aspectRatio}
                onPhoto={handlePhoto}
                onSubmit={handleSubmit}
                onRetake={handleRetake}
                onCancel={handleCancel}
                onError={handleError}
              />
            </div>
          </div>
        </div>

        {/* Callback Log */}
        <div className="lg:col-span-1">
          <CallbackLog entries={logEntries} onClear={handleClearLog} />
        </div>
      </div>
    </div>
  );
}
