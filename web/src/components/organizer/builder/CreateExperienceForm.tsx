"use client";

/**
 * CreateExperienceForm component for inline experience creation
 * Part of Phase 4 (User Story 2) - Create New Experience Inline
 *
 * Replaces modal-based creation with inline form at dedicated route
 * Uses React Hook Form + Zod for validation (Constitution Principle III)
 *
 * Features:
 * - Name input with trim validation
 * - Type selection with visual cards
 * - Real-time validation feedback
 * - Submit button enabled only when valid
 * - Redirect to experience editor after creation
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createExperienceSchema } from "@/lib/schemas/firestore";
import { createExperienceAction } from "@/app/actions/experiences";
import type { ExperienceType } from "@/lib/types/firestore";
import type { z } from "zod";

// Experience type options with descriptions and availability
interface ExperienceTypeOption {
  type: ExperienceType;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

const EXPERIENCE_TYPES: ExperienceTypeOption[] = [
  {
    type: "photo",
    label: "Photo",
    description: "Capture a single photo with optional AI transformation",
    icon: "📷",
    available: true,
  },
  {
    type: "video",
    label: "Video",
    description: "Record a short video clip",
    icon: "🎥",
    available: false,
  },
  {
    type: "gif",
    label: "GIF",
    description: "Create an animated GIF from multiple frames",
    icon: "🎞️",
    available: false,
  },
  {
    type: "wheel",
    label: "Wheel",
    description: "Spin a wheel to select from multiple experiences",
    icon: "🎡",
    available: false,
  },
];

type CreateExperienceInput = z.input<typeof createExperienceSchema>;

interface CreateExperienceFormProps {
  eventId: string;
}

export function CreateExperienceForm({ eventId }: CreateExperienceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateExperienceInput>({
    resolver: zodResolver(createExperienceSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      label: "",
      type: "photo", // Default to photo (only available type)
    },
  });

  const selectedType = watch("type");
  const nameValue = watch("label");

  const onSubmit = async (data: CreateExperienceInput) => {
    setIsSubmitting(true);

    try {
      const result = await createExperienceAction(eventId, data);

      if (result.success) {
        toast.success("Experience created successfully");
        // Redirect to experience editor (T018)
        router.push(
          `/events/${eventId}/design/experiences/${result.data.id}`
        );
      } else {
        toast.error(result.error || "Failed to create experience");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating experience:", error);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Experience Name Input */}
      <div className="space-y-3">
        <Label htmlFor="experience-name" className="text-base font-semibold">
          Experience Name
        </Label>
        <p className="text-sm text-muted-foreground">
          Give your experience a descriptive name (e.g., &quot;Avatar
          Creator&quot;, &quot;Festival Selfie&quot;).
        </p>

        <Input
          id="experience-name"
          placeholder="Enter experience name..."
          className={cn(
            "min-h-[44px]", // Touch target minimum (MFR-002)
            errors.label && "border-destructive focus-visible:ring-destructive"
          )}
          {...register("label")}
          aria-invalid={!!errors.label}
          aria-describedby={errors.label ? "name-error" : undefined}
        />

        {errors.label && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {errors.label.message}
          </p>
        )}

        {/* Character count helper */}
        <p className="text-xs text-muted-foreground">
          {nameValue.length}/50 characters
        </p>
      </div>
      {/* Experience Type Selection */}
      <div className="space-y-3">
        <Label htmlFor="experience-type" className="text-base font-semibold">
          Experience Type
        </Label>
        <p className="text-sm text-muted-foreground">
          Select the type of experience you want to create. Only photo
          experiences are available at this time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {EXPERIENCE_TYPES.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={!option.available}
              onClick={() => option.available && setValue("type", option.type, { shouldValidate: true })}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 transition-all",
                "min-h-[120px] min-w-0", // min-h for touch target, min-w-0 for text truncation
                "hover:border-primary/50",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selectedType === option.type && option.available
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
              aria-pressed={selectedType === option.type}
              aria-label={`${option.label} experience type${!option.available ? " (coming soon)" : ""}`}
            >
              {/* Coming Soon Badge */}
              {!option.available && (
                <div className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming Soon
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl" aria-hidden="true">
                {option.icon}
              </div>

              {/* Label */}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-sm">{option.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Hidden input for react-hook-form registration */}
        <input type="hidden" {...register("type")} />

        {errors.type && (
          <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
        )}
      </div>


      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="min-h-[44px] px-6"
        >
          {isSubmitting ? "Creating..." : "Create Experience"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="min-h-[44px] px-6"
        >
          Cancel
        </Button>
      </div>

      {/* Validation hint */}
      {!isValid && nameValue.trim().length === 0 && (
        <p className="text-sm text-muted-foreground">
          Enter a name to enable the Create button
        </p>
      )}
    </form>
  );
}
