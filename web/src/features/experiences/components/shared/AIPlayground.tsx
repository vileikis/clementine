"use client";

/**
 * AIPlayground - Test AI transformations with uploaded images
 *
 * Features:
 * - Drag-and-drop image upload with validation
 * - File type validation: JPEG, PNG, WebP only
 * - File size validation: Max 10MB
 * - Preview of uploaded test image
 * - Generate button to trigger AI transformation
 * - Display transformed result image
 * - Error state with retry option
 *
 * Note: Playground images are ephemeral and not persisted to storage.
 * This is for testing AI prompts before going live.
 */

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, AlertCircle, RefreshCw, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Constants for file validation
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_LABEL = "10MB";

// Playground states
type PlaygroundState = "idle" | "ready" | "generating" | "result" | "error";

interface AIPlaygroundProps {
  /** Experience ID for the current experience */
  experienceId: string;
  /** Current AI prompt from the configuration (used for UI validation) */
  prompt: string;
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
    return "Please upload a JPEG, PNG, or WebP image";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Image must be less than ${MAX_SIZE_LABEL}`;
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

export function AIPlayground({
  experienceId,
  prompt,
  onGenerationComplete,
  disabled = false,
  className,
}: AIPlaygroundProps) {
  // Playground state
  const [state, setState] = useState<PlaygroundState>("idle");
  const [testImageFile, setTestImageFile] = useState<File | null>(null);
  const [testImagePreview, setTestImagePreview] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag state for visual feedback
  const [isDragging, setIsDragging] = useState(false);

  // File input ref for programmatic click
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

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

    setState("generating");
    setError(null);

    try {
      // Import the server action dynamically to avoid bundling issues
      const { generatePlaygroundPreview } = await import(
        "../../actions/playground-generate"
      );

      const result = await generatePlaygroundPreview({
        experienceId,
        testImageBase64: testImagePreview,
      });

      if (result.success) {
        setResultImageUrl(result.data.resultImageBase64);
        setState("result");
        onGenerationComplete?.(true);
      } else {
        setError(result.error.message);
        setState("error");
        onGenerationComplete?.(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("error");
      onGenerationComplete?.(false);
    }
  }, [testImageFile, testImagePreview, experienceId, onGenerationComplete]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (testImageFile) {
      setState("ready");
      setError(null);
    } else {
      setState("idle");
      setError(null);
    }
  }, [testImageFile]);

  // Handle clear/reset
  const handleClear = useCallback(() => {
    setTestImageFile(null);
    setTestImagePreview(null);
    setResultImageUrl(null);
    setError(null);
    setState("idle");
  }, []);

  // Click handler for upload area
  const handleUploadClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">AI Playground</CardTitle>
          {state !== "idle" && state !== "generating" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Clear and start over"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Test your AI transformation with a sample image
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
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

        {/* Image Preview - shown when ready, generating, result, or error with image */}
        {testImagePreview && state !== "idle" && (
          <div className="space-y-4">
            {/* Before/After comparison */}
            <div className="grid grid-cols-2 gap-3">
              {/* Input image */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Input</p>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  <Image
                    src={testImagePreview}
                    alt="Test image"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>

              {/* Result image */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Result</p>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  {state === "generating" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {state === "result" && resultImageUrl && (
                    <Image
                      src={resultImageUrl}
                      alt="AI transformed result"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                  {(state === "ready" || state === "error") && !resultImageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {state === "error" && error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {state === "ready" && (
                <Button
                  onClick={handleGenerate}
                  disabled={disabled || !prompt}
                  className="flex-1 min-h-[44px]"
                >
                  Generate
                </Button>
              )}
              {state === "generating" && (
                <Button disabled className="flex-1 min-h-[44px]">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </Button>
              )}
              {state === "result" && (
                <Button
                  onClick={handleGenerate}
                  disabled={disabled || !prompt}
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

            {/* Prompt preview */}
            {!prompt && (
              <p className="text-xs text-muted-foreground text-center">
                Add a prompt in the configuration panel to enable generation
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
