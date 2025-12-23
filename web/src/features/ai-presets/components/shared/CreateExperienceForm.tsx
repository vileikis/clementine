"use client";

/**
 * CreateExperienceForm component for inline experience creation
 * Refactored for normalized Firestore design (data-model-v4).
 *
 * Replaces modal-based creation with inline form at dedicated route
 * Uses React Hook Form + Zod for validation (Constitution Principle III)
 *
 * Features:
 * - Name input with trim validation (renamed from 'label')
 * - Type selection with visual cards
 * - Real-time validation feedback
 * - Submit button enabled only when valid
 * - Redirect to experience editor after creation
 * - Accepts companyId from context (via event's ownerId)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
  createPhotoExperienceSchema,
  createGifExperienceSchema,
} from "../../schemas";
import { createPhotoExperience } from "../../actions/photo-create";
import { createGifExperience } from "../../actions/gif-create";

import { ExperienceTypeSelector } from "./ExperienceTypeSelector";

// Union schema for photo, GIF
const createExperienceSchema = z.union([
  createPhotoExperienceSchema,
  createGifExperienceSchema,
]);

type CreateExperienceInput = z.input<typeof createExperienceSchema>;

interface CreateExperienceFormProps {
  eventId: string;
  companyId: string;
}

export function CreateExperienceForm({ eventId, companyId }: CreateExperienceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CreateExperienceInput>({
    resolver: standardSchemaResolver(createExperienceSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      companyId, // Set from props
      name: "",
      type: "photo", // Default to photo (only available type)
      eventIds: [], // Will be auto-populated by server action
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form watch() is used safely here
  const selectedType = watch("type");
  const nameValue = watch("name");

  const onSubmit = async (data: CreateExperienceInput) => {
    setIsSubmitting(true);

    try {
      // Route to correct Server Action based on type
      const result =
        data.type === "gif"
          ? await createGifExperience(eventId, data)
          : await createPhotoExperience(eventId, data);

      if (result.success) {
        toast.success("Experience created successfully");
        // Redirect to experience editor
        router.push(
          `/events/${eventId}/experiences/${result.data.id}`
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
            errors.name && "border-destructive focus-visible:ring-destructive"
          )}
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />

        {errors.name && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {errors.name.message}
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
          Select the type of experience you want to create.
        </p>

        <ExperienceTypeSelector
          selectedType={selectedType}
          onSelect={(type) => {
            // Photo and GIF types are currently supported
            if (type === "photo" || type === "gif") {
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
