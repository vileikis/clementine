// ============================================================================
// Engine Schemas
// ============================================================================
// Zod validation schemas for Experience Engine configuration.

import { z } from "zod";
import { stepSchema } from "@/features/steps/schemas";
import { projectThemeSchema } from "@/features/projects/schemas";

// ============================================================================
// Engine Status
// ============================================================================

export const engineStatusSchema = z.enum([
  "idle",
  "loading",
  "running",
  "completed",
  "error",
]);

// ============================================================================
// Engine Config
// ============================================================================

export const engineConfigSchema = z
  .object({
    // Required fields
    experienceId: z.string().min(1),
    steps: z.array(stepSchema),
    stepsOrder: z.array(z.string()),
    flowName: z.string().min(1).max(100),

    // Session mode
    persistSession: z.boolean(),
    existingSessionId: z.string().optional(),

    // Navigation flags
    allowBack: z.boolean(),
    allowSkip: z.boolean(),

    // Integration
    debugMode: z.boolean(),
    theme: projectThemeSchema.optional(),

    // Context (for persisted mode)
    projectId: z.string().optional(),
    eventId: z.string().optional(),
    companyId: z.string().optional(),

    // Callbacks are validated at runtime (can't validate functions with Zod)
    onStart: z.function().optional(),
    onStepChange: z.function().optional(),
    onDataUpdate: z.function().optional(),
    onComplete: z.function().optional(),
    onError: z.function().optional(),
  })
  .refine(
    (data) => {
      // Steps array and stepsOrder should have matching lengths
      return data.steps.length === data.stepsOrder.length;
    },
    {
      message: "steps and stepsOrder must have matching lengths",
    }
  )
  .refine(
    (data) => {
      // All step IDs in stepsOrder should exist in steps
      const stepIds = new Set(data.steps.map((s) => s.id));
      return data.stepsOrder.every((id) => stepIds.has(id));
    },
    {
      message: "All step IDs in stepsOrder must exist in steps array",
    }
  );

// ============================================================================
// Engine State
// ============================================================================

export const engineStateSchema = z.object({
  status: engineStatusSchema,
  currentStepIndex: z.number().int().min(0),
  currentStep: stepSchema.nullable(),
  sessionData: z.record(z.string(), z.unknown()),
  transformStatus: z.object({
    status: z.enum(["idle", "pending", "processing", "complete", "error"]),
    resultUrl: z.string().optional(),
    errorMessage: z.string().optional(),
    jobId: z.string().optional(),
    updatedAt: z.number().optional(),
  }),
  canGoBack: z.boolean(),
  canGoNext: z.boolean(),
  canSkip: z.boolean(),
  isAutoAdvancing: z.boolean(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type EngineConfigSchema = z.infer<typeof engineConfigSchema>;
export type EngineStatusSchema = z.infer<typeof engineStatusSchema>;
export type EngineStateSchema = z.infer<typeof engineStateSchema>;
