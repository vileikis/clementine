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
import { createPhotoExperienceSchema as createExperienceSchema } from "../../lib/schemas";
import { createPhotoExperience } from "../../actions/photo-create";
import { ExperienceTypeSelector } from "./ExperienceTypeSelector";
import type { z } from "zod";

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
      const result = await createPhotoExperience(eventId, data);

      if (result.success) {
        toast.success("Experience created successfully");
        // Redirect to experience editor
        router.push(
          `/events/${eventId}/design/experiences/${result.data.id}`
        );
      } else {
        toast.error(result.error.message || "Failed to create experience");
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

        <ExperienceTypeSelector
          selectedType={selectedType}
          onSelect={(type) => {
            // Only photo type is currently supported
            if (type === "photo") {
              setValue("type", type, { shouldValidate: true });
            }
          }}
        />

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
