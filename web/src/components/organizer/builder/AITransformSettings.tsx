"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ImageUploadField } from "./ImageUploadField";
import { AI_MODEL_PROMPT_GUIDES } from "@/lib/constants/ai-models";
import type { AspectRatio } from "@/lib/types/firestore";

interface AITransformSettingsProps {
  aiModel: string;
  aiPrompt: string;
  aiReferenceImagePaths: string[];
  aiAspectRatio: AspectRatio;
  onAiModelChange: (model: string) => void;
  onAiPromptChange: (prompt: string) => void;
  onAiReferenceImagePathsChange: (paths: string[]) => void;
  onAiAspectRatioChange: (aspectRatio: AspectRatio) => void;
  disabled?: boolean;
}

// Aspect ratio options with human-readable labels and use case hints
const ASPECT_RATIO_OPTIONS: Array<{ value: AspectRatio; label: string; hint: string }> = [
  { value: "1:1", label: "1:1 Square", hint: "Instagram posts" },
  { value: "3:4", label: "3:4 Portrait", hint: "Vertical photos" },
  { value: "4:5", label: "4:5 Portrait", hint: "Instagram portraits" },
  { value: "9:16", label: "9:16 Portrait", hint: "Stories, Reels" },
  { value: "16:9", label: "16:9 Landscape", hint: "Widescreen" },
];

/**
 * AITransformSettings component for configuring AI transformation settings.
 * Created in 001-photo-experience-tweaks (User Story 5 - Priority P1 - MVP).
 *
 * Features:
 * - Horizontal Flexbox row layout for reference images with responsive wrapping
 * - Aspect ratio picker with 5 predefined options and use case hints
 * - Prompt Guide link with dynamic URL based on selected AI model
 * - Model picker dropdown
 * - Prompt textarea
 * - Mobile-friendly: touch targets ≥44x44px, horizontal scrolling on small screens
 *
 * Usage:
 * ```tsx
 * <AITransformSettings
 *   aiModel={aiModel}
 *   aiPrompt={aiPrompt}
 *   aiReferenceImagePaths={aiReferenceImagePaths}
 *   aiAspectRatio={aiAspectRatio}
 *   onAiModelChange={setAiModel}
 *   onAiPromptChange={setAiPrompt}
 *   onAiReferenceImagePathsChange={setAiReferenceImagePaths}
 *   onAiAspectRatioChange={setAiAspectRatio}
 * />
 * ```
 */
export function AITransformSettings({
  aiModel,
  aiPrompt,
  aiReferenceImagePaths,
  aiAspectRatio,
  onAiModelChange,
  onAiPromptChange,
  onAiReferenceImagePathsChange,
  onAiAspectRatioChange,
  disabled = false,
}: AITransformSettingsProps) {
  // Get prompt guide URL for current model
  const promptGuideUrl = AI_MODEL_PROMPT_GUIDES[aiModel];

  // Handle reference image addition
  const handleAddReferenceImage = (url: string) => {
    onAiReferenceImagePathsChange([...aiReferenceImagePaths, url]);
  };

  // Handle reference image removal
  const handleRemoveReferenceImage = (index: number) => {
    onAiReferenceImagePathsChange(aiReferenceImagePaths.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Model Picker with Prompt Guide Link */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="aiModel">AI Model</Label>
          {promptGuideUrl && (
            <a
              href={promptGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1 min-h-[44px] py-2"
            >
              Prompt Guide
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Select value={aiModel} onValueChange={onAiModelChange} disabled={disabled}>
          <SelectTrigger id="aiModel">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nanobanana">Nano Banana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio Picker */}
      <div className="space-y-2">
        <Label htmlFor="aiAspectRatio">Aspect Ratio</Label>
        <Select
          value={aiAspectRatio}
          onValueChange={(value) => onAiAspectRatioChange(value as AspectRatio)}
          disabled={disabled}
        >
          <SelectTrigger id="aiAspectRatio">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{option.hint}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the output aspect ratio for AI-generated photos.
        </p>
      </div>

      {/* AI Prompt */}
      <div className="space-y-2">
        <Label htmlFor="aiPrompt">AI Prompt</Label>
        <Textarea
          id="aiPrompt"
          value={aiPrompt}
          onChange={(e) => onAiPromptChange(e.target.value)}
          placeholder="Describe the AI transformation..."
          rows={4}
          maxLength={600}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          {aiPrompt.length}/600 characters
        </p>
      </div>

      {/* Reference Images - Horizontal Layout with Flex-Wrap */}
      <div className="space-y-2">
        <Label>Reference Images</Label>
        {aiReferenceImagePaths.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {aiReferenceImagePaths.map((path, index) => (
              <div
                key={index}
                className="relative w-32 h-32 overflow-hidden rounded-lg border bg-muted flex-shrink-0"
              >
                <img
                  src={path}
                  alt={`Reference ${index + 1}`}
                  className="h-full w-full object-contain"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 min-h-[44px] min-w-[44px]"
                  onClick={() => handleRemoveReferenceImage(index)}
                  disabled={disabled}
                  type="button"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
        <ImageUploadField
          id={`ai-reference-${aiReferenceImagePaths.length}`}
          label={aiReferenceImagePaths.length === 0 ? "Add Reference Image" : "Add Another Reference"}
          value=""
          onChange={handleAddReferenceImage}
          destination="ai-reference"
          disabled={disabled}
          recommendedSize="Max 10MB. Used to guide AI transformation style."
        />
        <p className="text-xs text-muted-foreground">
          Upload reference images to guide the AI transformation style. Images appear in a horizontal row.
        </p>
      </div>
    </div>
  );
}
