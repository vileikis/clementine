"use client";

/**
 * StepAIPlayground - Test AI transformations with uploaded images
 *
 * Features:
 * - Horizontal layout on desktop (input left, result right)
 * - Vertical layout on mobile (stacked)
 * - Drag-and-drop image upload with validation
 * - File type validation: JPEG, PNG, WebP only
 * - File size validation: Max 10MB
 * - Preview of uploaded test image
 * - Generate button to trigger AI transformation
 * - Display transformed result image
 * - Error state with retry option
 * - Live timer during generation + total time display
 * - Regenerate button for iteration
 * - Clear button to start fresh
 *
 * Note: Playground images are ephemeral and not persisted.
 * This is for testing AI prompts before going live.
 *
 * @feature 019-ai-transform-playground
 */

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiTransformConfigSchema } from "../../schemas";

// Constants for file validation
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_LABEL = "10MB";

// Playground states
type PlaygroundState = "idle" | "ready" | "generating" | "result" | "error";

interface StepAIPlaygroundProps {
  /** Step ID for the current ai-transform step */
  stepId: string;
  /** Current AI config from the step (used for validation) */
  config: AiTransformConfigSchema;
  /** Optional callback when generation completes (for analytics, etc.) */
  onGenerationComplete?: (success: boolean) => void;
  /** Whether the playground is disabled */
  disabled?: boolean;
  /** Optional class name */
  className?: string;
}

/**
 * Validates an uploaded file for type and size
 * @returns Error message if invalid, null if valid
 */
function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Image must be under ${MAX_SIZE_LABEL}`;
  }
  return null;
}

/**
 * Converts a File to a base64 data URL for preview
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format seconds to display string (e.g., "5s" or "1m 23s")
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function StepAIPlayground({
  stepId,
  config,
  onGenerationComplete,
  disabled = false,
  className,
}: StepAIPlaygroundProps) {
  // Playground state
  const [state, setState] = useState<PlaygroundState>("idle");
  const [testImageFile, setTestImageFile] = useState<File | null>(null);
  const [testImagePreview, setTestImagePreview] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalGenerationTime, setTotalGenerationTime] = useState<number | null>(
    null
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag state for visual feedback
  const [isDragging, setIsDragging] = useState(false);

  // File input ref for programmatic click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if prompt is configured
  const hasPrompt = Boolean(config?.prompt);

  // Timer effect - runs during generation
  useEffect(() => {
    if (state === "generating") {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  // Handle file selection (from input or drop)
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setTestImageFile(file);
      setTestImagePreview(dataUrl);
      setResultImageUrl(null);
      setError(null);
      setTotalGenerationTime(null);
      setState("ready");
    } catch {
      setError("Failed to read the image file");
      setState("error");
    }
  }, []);

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value to allow re-selecting the same file
      e.target.value = "";
    },
    [handleFileSelect]
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    if (!testImageFile || !testImagePreview) return;

    const startTime = Date.now();
    setState("generating");
    setError(null);
    setTotalGenerationTime(null);

    try {
      // Import the server action dynamically to avoid bundling issues
      const { generateStepPreview } = await import(
        "../../actions/step-playground"
      );

      const result = await generateStepPreview({
        stepId,
        testImageBase64: testImagePreview,
      });

      const endTime = Date.now();
      const totalSeconds = Math.round((endTime - startTime) / 1000);
      setTotalGenerationTime(totalSeconds);

      if (result.success) {
        setResultImageUrl(result.data.resultImageBase64);
        setState("result");
        onGenerationComplete?.(true);
      } else {
        // Map error codes to user-friendly messages
        let errorMessage = result.error.message;
        if (result.error.code === "AI_GENERATION_FAILED") {
          errorMessage =
            "AI service temporarily unavailable. Please try again.";
        }
        setError(errorMessage);
        setState("error");
        onGenerationComplete?.(false);
      }
    } catch (err) {
      const endTime = Date.now();
      const totalSeconds = Math.round((endTime - startTime) / 1000);
      setTotalGenerationTime(totalSeconds);
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("error");
      onGenerationComplete?.(false);
    }
  }, [testImageFile, testImagePreview, stepId, onGenerationComplete]);

  // Handle retry (keeps the image, resets error state)
  const handleRetry = useCallback(() => {
    if (testImageFile) {
      setState("ready");
      setError(null);
      setTotalGenerationTime(null);
    } else {
      setState("idle");
      setError(null);
      setTotalGenerationTime(null);
    }
  }, [testImageFile]);

  // Handle clear/reset (removes everything)
  const handleClear = useCallback(() => {
    setTestImageFile(null);
    setTestImagePreview(null);
    setResultImageUrl(null);
    setError(null);
    setTotalGenerationTime(null);
    setState("idle");
  }, []);

  // Click handler for upload area
  const handleUploadClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area - shown when idle or error without image */}
      {(state === "idle" || (state === "error" && !testImagePreview)) && (
        <div
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "min-h-[200px] rounded-lg border-2 border-dashed",
            "cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {isDragging ? "Drop image here" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, or WebP (max {MAX_SIZE_LABEL})
          </p>
        </div>
      )}

      {/* Error message for upload errors (no image preview) */}
      {state === "error" && error && !testImagePreview && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main content area - horizontal on desktop, vertical on mobile */}
      {testImagePreview && state !== "idle" && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Input image panel */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Input</p>
              {state !== "generating" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled}
                  className="h-8 px-2 text-xs"
                  title="Clear and start over"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="aspect-square w-full relative rounded-lg overflow-hidden bg-muted border">
              <Image
                src={testImagePreview}
                alt="Test image"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Result image panel - only shown when result or generating */}
          {(state === "result" || state === "generating") && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Result
                </p>
                {totalGenerationTime !== null && state === "result" && (
                  <p className="text-xs text-muted-foreground">
                    Generated in {formatTime(totalGenerationTime)}
                  </p>
                )}
              </div>
              <div className="aspect-square w-full relative rounded-lg overflow-hidden bg-muted border">
                {state === "generating" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Generating... {formatTime(elapsedSeconds)}
                    </p>
                  </div>
                ) : resultImageUrl ? (
                  <Image
                    src={resultImageUrl}
                    alt="AI transformed result"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons and error messages */}
      {testImagePreview && state !== "idle" && (
        <div className="space-y-3">
          {/* Error message with retry */}
          {state === "error" && error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {state === "ready" && (
              <Button
                onClick={handleGenerate}
                disabled={disabled || !hasPrompt}
                className="flex-1 min-h-[44px]"
              >
                Generate
              </Button>
            )}
            {state === "generating" && (
              <Button disabled className="flex-1 min-h-[44px]">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating... {formatTime(elapsedSeconds)}
              </Button>
            )}
            {state === "result" && (
              <Button
                onClick={handleGenerate}
                disabled={disabled || !hasPrompt}
                className="flex-1 min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
            {state === "error" && (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1 min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>

          {/* Prompt validation message */}
          {!hasPrompt && (
            <p className="text-xs text-muted-foreground text-center">
              Add a prompt in the configuration to enable generation
            </p>
          )}
        </div>
      )}
    </div>
  );
}
