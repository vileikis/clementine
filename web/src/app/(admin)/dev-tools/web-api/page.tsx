"use client";

/**
 * Web API Test Page
 *
 * Tests browser support for various Web APIs used in the application.
 * Primary focus: ImageCapture API for camera functionality.
 */

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiCheck {
  name: string;
  description: string;
  supported: boolean | null;
  details?: string;
  docsUrl?: string;
}

function ApiStatusIcon({ supported }: { supported: boolean | null }) {
  if (supported === null) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }
  if (supported) {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  }
  return <XCircle className="h-5 w-5 text-red-600" />;
}

function ApiCheckCard({ check }: { check: ApiCheck }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        check.supported === true && "border-green-200 bg-green-50",
        check.supported === false && "border-red-200 bg-red-50",
        check.supported === null && "border-muted"
      )}
    >
      <div className="flex items-start gap-3">
        <ApiStatusIcon supported={check.supported} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{check.name}</h3>
            {check.docsUrl && (
              <a
                href={check.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                MDN Docs
              </a>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {check.description}
          </p>
          {check.details && (
            <p className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded">
              {check.details}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Compute API checks (runs on client only)
function getApiChecks(): ApiCheck[] {
  if (typeof window === "undefined") return [];

  return [
    {
      name: "ImageCapture API",
      description:
        "Enables capturing still images from a camera. Required for high-quality photo capture without canvas workarounds.",
      supported: "ImageCapture" in window,
      details:
        "ImageCapture" in window
          ? "window.ImageCapture is available"
          : "window.ImageCapture is undefined",
      docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture",
    },
    {
      name: "MediaDevices API",
      description:
        "Provides access to connected media input devices like cameras and microphones.",
      supported:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      details:
        "mediaDevices" in navigator
          ? "navigator.mediaDevices is available"
          : "navigator.mediaDevices is undefined",
      docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices",
    },
    {
      name: "MediaStream API",
      description:
        "Represents a stream of media content, used for camera/video capture.",
      supported: "MediaStream" in window,
      details:
        "MediaStream" in window
          ? "window.MediaStream is available"
          : "window.MediaStream is undefined",
      docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/MediaStream",
    },
    {
      name: "Canvas API (2D)",
      description:
        "Fallback for image capture when ImageCapture is not available.",
      supported:
        typeof document !== "undefined" &&
        !!document.createElement("canvas").getContext("2d"),
      details: "Canvas 2D context is available",
      docsUrl:
        "https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D",
    },
    {
      name: "OffscreenCanvas",
      description:
        "Canvas that can be rendered off the main thread for better performance.",
      supported: "OffscreenCanvas" in window,
      details:
        "OffscreenCanvas" in window
          ? "window.OffscreenCanvas is available"
          : "window.OffscreenCanvas is undefined",
      docsUrl:
        "https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas",
    },
    {
      name: "Blob API",
      description: "Represents immutable raw binary data, used for image data.",
      supported: "Blob" in window,
      details:
        "Blob" in window
          ? "window.Blob is available"
          : "window.Blob is undefined",
      docsUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Blob",
    },
    {
      name: "createImageBitmap",
      description:
        "Creates an ImageBitmap from various sources for efficient image processing.",
      supported: "createImageBitmap" in window,
      details:
        "createImageBitmap" in window
          ? "window.createImageBitmap is available"
          : "window.createImageBitmap is undefined",
      docsUrl:
        "https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap",
    },
  ];
}

export default function WebApiTestPage() {
  // Use lazy initialization to avoid setState in effect
  const [apiChecks] = useState<ApiCheck[]>(getApiChecks);
  const [browserInfo] = useState<string>(() =>
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  const isLoading = apiChecks.length === 0;

  const supportedCount = apiChecks.filter((c) => c.supported === true).length;
  const totalCount = apiChecks.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Web API Support Test</h2>
        <p className="text-sm text-muted-foreground">
          Check browser support for camera and image-related Web APIs
        </p>
      </div>

      {/* Browser Info */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-sm">Browser Information</h3>
            <p className="mt-1 text-xs text-muted-foreground break-all">
              {browserInfo || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Support Summary:</span>
          <span
            className={cn(
              "px-2 py-1 rounded",
              supportedCount === totalCount
                ? "bg-green-100 text-green-800"
                : supportedCount >= totalCount - 2
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            )}
          >
            {supportedCount}/{totalCount} APIs supported
          </span>
        </div>
      )}

      {/* API Checks */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          apiChecks.map((check) => (
            <ApiCheckCard key={check.name} check={check} />
          ))
        )}
      </div>

      {/* ImageCapture Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-medium text-blue-900">Note on ImageCapture API</h3>
        <p className="mt-1 text-sm text-blue-800">
          The ImageCapture API is{" "}
          <strong>not supported in Safari or iOS browsers</strong>. For these
          browsers, we fall back to capturing frames from the video stream using
          Canvas API.
        </p>
        <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
          <li>Chrome/Edge: Full ImageCapture support</li>
          <li>Firefox: Partial support (check specific methods)</li>
          <li>Safari/iOS: No support - uses Canvas fallback</li>
        </ul>
      </div>
    </div>
  );
}
