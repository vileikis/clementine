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

import { useCallback, useRef, useEffect, useReducer } from "react";
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
type PlaygroundPhase = "idle" | "ready" | "generating" | "result" | "error";

// ============================================================================
// Reducer State & Actions
// ============================================================================

interface PlaygroundState {
  phase: PlaygroundPhase;
  testImageFile: File | null;
  testImagePreview: string | null;
  resultImageUrl: string | null;
  error: string | null;
  elapsedSeconds: number;
  totalGenerationTime: number | null;
  isDragging: boolean;
}

type PlaygroundAction =
  | { type: "SET_DRAGGING"; isDragging: boolean }
  | { type: "FILE_SELECTED"; file: File; preview: string }
  | { type: "FILE_ERROR"; error: string }
  | { type: "START_GENERATION" }
  | { type: "TICK_TIMER" }
  | { type: "GENERATION_SUCCESS"; resultUrl: string; totalTime: number }
  | { type: "GENERATION_ERROR"; error: string; totalTime: number }
  | { type: "RETRY" }
  | { type: "CLEAR" };

const initialState: PlaygroundState = {
  phase: "idle",
  testImageFile: null,
  testImagePreview: null,
  resultImageUrl: null,
  error: null,
  elapsedSeconds: 0,
  totalGenerationTime: null,
  isDragging: false,
};

function playgroundReducer(
  state: PlaygroundState,
  action: PlaygroundAction
): PlaygroundState {
  switch (action.type) {
    case "SET_DRAGGING":
      return { ...state, isDragging: action.isDragging };

    case "FILE_SELECTED":
      return {
        ...state,
        phase: "ready",
        testImageFile: action.file,
        testImagePreview: action.preview,
        resultImageUrl: null,
        error: null,
        totalGenerationTime: null,
        isDragging: false,
      };

    case "FILE_ERROR":
      return {
        ...state,
        phase: "error",
        error: action.error,
        isDragging: false,
      };

    case "START_GENERATION":
      return {
        ...state,
        phase: "generating",
        error: null,
        elapsedSeconds: 0,
        totalGenerationTime: null,
      };

    case "TICK_TIMER":
      return {
        ...state,
        elapsedSeconds: state.elapsedSeconds + 1,
      };

    case "GENERATION_SUCCESS":
      return {
        ...state,
        phase: "result",
        resultImageUrl: action.resultUrl,
        totalGenerationTime: action.totalTime,
      };

    case "GENERATION_ERROR":
      return {
        ...state,
        phase: "error",
        error: action.error,
        totalGenerationTime: action.totalTime,
      };

    case "RETRY":
      return {
        ...state,
        phase: state.testImageFile ? "ready" : "idle",
        error: null,
        totalGenerationTime: null,
      };

    case "CLEAR":
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Props & Helpers
// ============================================================================

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

// ============================================================================
// Component
// ============================================================================

export function StepAIPlayground({
  stepId,
  config,
  onGenerationComplete,
  disabled = false,
  className,
}: StepAIPlaygroundProps) {
  const [state, dispatch] = useReducer(playgroundReducer, initialState);
  const {
    phase,
    testImageFile,
    testImagePreview,
    resultImageUrl,
    error,
    elapsedSeconds,
    totalGenerationTime,
    isDragging,
  } = state;

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if prompt is configured
  const hasPrompt = Boolean(config?.prompt);

  // Timer effect - runs during generation
  useEffect(() => {
    if (phase === "generating") {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK_TIMER" });
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
  }, [phase]);

  // Handle file selection (from input or drop)
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      dispatch({ type: "FILE_ERROR", error: validationError });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      dispatch({ type: "FILE_SELECTED", file, preview: dataUrl });
    } catch {
      dispatch({ type: "FILE_ERROR", error: "Failed to read the image file" });
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
        dispatch({ type: "SET_DRAGGING", isDragging: true });
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_DRAGGING", isDragging: false });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "SET_DRAGGING", isDragging: false });

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
    dispatch({ type: "START_GENERATION" });

    try {
      // Import the server action dynamically to avoid bundling issues
      const { generateStepPreview } = await import(
        "../../actions/step-playground"
      );

      const result = await generateStepPreview({
        stepId,
        testImageBase64: testImagePreview,
      });

      const totalSeconds = Math.round((Date.now() - startTime) / 1000);

      if (result.success) {
        dispatch({
          type: "GENERATION_SUCCESS",
          resultUrl: result.data.resultImageBase64,
          totalTime: totalSeconds,
        });
        onGenerationComplete?.(true);
      } else {
        // Map error codes to user-friendly messages
        let errorMessage = result.error.message;
        if (result.error.code === "AI_GENERATION_FAILED") {
          errorMessage =
            "AI service temporarily unavailable. Please try again.";
        }
        dispatch({
          type: "GENERATION_ERROR",
          error: errorMessage,
          totalTime: totalSeconds,
        });
        onGenerationComplete?.(false);
      }
    } catch (err) {
      const totalSeconds = Math.round((Date.now() - startTime) / 1000);
      dispatch({
        type: "GENERATION_ERROR",
        error: err instanceof Error ? err.message : "Generation failed",
        totalTime: totalSeconds,
      });
      onGenerationComplete?.(false);
    }
  }, [testImageFile, testImagePreview, stepId, onGenerationComplete]);

  // Handle retry (keeps the image, resets error state)
  const handleRetry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  // Handle clear/reset (removes everything)
  const handleClear = useCallback(() => {
    dispatch({ type: "CLEAR" });
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
      {(phase === "idle" || (phase === "error" && !testImagePreview)) && (
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
      {phase === "error" && error && !testImagePreview && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main content area - horizontal on desktop, vertical on mobile */}
      {testImagePreview && phase !== "idle" && (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Input image panel */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Input</p>
              {phase !== "generating" && (
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
          {(phase === "result" || phase === "generating") && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Result
                </p>
                {totalGenerationTime !== null && phase === "result" && (
                  <p className="text-xs text-muted-foreground">
                    Generated in {formatTime(totalGenerationTime)}
                  </p>
                )}
              </div>
              <div className="aspect-square w-full relative rounded-lg overflow-hidden bg-muted border">
                {phase === "generating" ? (
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
      {testImagePreview && phase !== "idle" && (
        <div className="space-y-3">
          {/* Error message with retry */}
          {phase === "error" && error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {phase === "ready" && (
              <Button
                onClick={handleGenerate}
                disabled={disabled || !hasPrompt}
                className="flex-1 min-h-[44px]"
              >
                Generate
              </Button>
            )}
            {phase === "generating" && (
              <Button disabled className="flex-1 min-h-[44px]">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating... {formatTime(elapsedSeconds)}
              </Button>
            )}
            {phase === "result" && (
              <Button
                onClick={handleGenerate}
                disabled={disabled || !hasPrompt}
                className="flex-1 min-h-[44px]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
            {phase === "error" && (
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
