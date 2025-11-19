# Quickstart: Evolve Experiences Schema

**Feature**: 003-experience-schema
**Branch**: `003-experience-schema`
**Date**: 2025-11-19

## Overview

This quickstart guide helps developers understand and implement the new experiences schema using TypeScript discriminated unions. It covers the new schema structure, migration strategy, and how to work with the updated APIs.

---

## What's Changing?

### Before (Flat Schema)

```typescript
// Legacy experience document
{
  id: "exp_123",
  type: "photo",
  label: "My Booth",

  // Flat configuration fields
  countdownEnabled: true,
  countdownSeconds: 3,
  overlayFramePath: "https://...",

  // Flat AI fields
  aiEnabled: true,
  aiModel: "flux-schnell",
  aiPrompt: "Transform to vintage",
  aiAspectRatio: "1:1"
}
```

### After (Discriminated Union Schema)

```typescript
// New experience document
{
  id: "exp_123",
  type: "photo",  // Discriminator
  label: "My Booth",

  // Type-specific config object
  config: {
    countdown: 3,
    overlayFramePath: "https://..."
  },

  // Shared AI config object
  aiConfig: {
    enabled: true,
    model: "flux-schnell",
    prompt: "Transform to vintage",
    referenceImagePaths: null,
    aspectRatio: "1:1"
  }
}
```

**Key Changes**:
1. Configuration moved into `config` object (type-specific)
2. AI settings moved into `aiConfig` object (shared across types)
3. Boolean flags removed (`countdownEnabled` → `countdown: 0` means disabled)
4. Schema ready for future types (video, gif, wheel, survey)

---

## Quick Reference

### TypeScript Types

```typescript
import type { PhotoExperience } from "@/features/experiences/lib/schemas";

// Use the discriminated union type
function renderExperience(experience: PhotoExperience) {
  // Access type-specific config
  const countdown = experience.config.countdown ?? 0;
  const hasOverlay = !!experience.config.overlayFramePath;

  // Access shared AI config
  if (experience.aiConfig.enabled) {
    console.log("AI Model:", experience.aiConfig.model);
    console.log("Prompt:", experience.aiConfig.prompt);
  }
}
```

### Default Values

When creating new photo experiences:

```typescript
const defaults = {
  config: {
    countdown: 0,              // No countdown by default
    overlayFramePath: null,    // No overlay by default
  },
  aiConfig: {
    enabled: false,            // AI disabled by default
    model: null,               // No model by default
    prompt: null,              // No prompt by default
    referenceImagePaths: null, // No references by default
    aspectRatio: "1:1"         // Square format (most common)
  }
};
```

### Migration Strategy

**Automatic Migration**: Legacy experiences are automatically migrated to the new schema when saved via the builder UI.

**Manual Migration** (if needed):

```typescript
import { migratePhotoExperience } from "@/features/experiences/lib/migration";

// Migrate a legacy document
const legacy = await db.collection("experiences").doc("exp_123").get();
const migrated = migratePhotoExperience(legacy.data());

// Write back to Firestore
await db.collection("experiences").doc("exp_123").set(migrated);
```

---

## Common Tasks

### Task 1: Create a New Photo Experience

```typescript
// Import from barrel export (recommended)
import { createPhotoExperience, type ActionResponse } from "@/features/experiences/actions";

// Or import directly from specific file
// import { createPhotoExperience } from "@/features/experiences/actions/photo-create";

async function createExperience(eventId: string) {
  const result = await createPhotoExperience(eventId, {
    label: "Summer Photo Booth",
    type: "photo",
  });

  if (result.success) {
    console.log("Created:", result.data);
    // result.data.config.countdown === 0
    // result.data.aiConfig.enabled === false
    // result.data.aiConfig.aspectRatio === "1:1"
  }
}
```

### Task 2: Update Photo Configuration

```typescript
// Import from barrel export (recommended)
import { updatePhotoExperience } from "@/features/experiences/actions";

async function updateCountdown(eventId: string, experienceId: string) {
  const result = await updatePhotoExperience(eventId, experienceId, {
    config: {
      countdown: 5,  // Update just countdown, preserve other config fields
    },
  });

  if (result.success) {
    console.log("Updated countdown to 5 seconds");
  }
}
```

### Task 3: Enable AI Transformation

```typescript
import { updatePhotoExperience } from "@/features/experiences/actions";

async function enableAI(eventId: string, experienceId: string) {
  const result = await updatePhotoExperience(eventId, experienceId, {
    aiConfig: {
      enabled: true,
      model: "flux-schnell",
      prompt: "Transform into vintage polaroid style",
      aspectRatio: "1:1",
    },
  });

  if (result.success) {
    console.log("AI enabled");
  }
}
```

### Task 4: Subscribe to Experience Updates (Real-time)

```typescript
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { photoExperienceSchema } from "@/features/experiences/lib/schemas";

function usePhotoExperience(eventId: string, experienceId: string) {
  const [experience, setExperience] = useState<PhotoExperience | null>(null);

  useEffect(() => {
    const docRef = doc(db, `events/${eventId}/experiences/${experienceId}`);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        // Validate data with Zod schema
        const validated = photoExperienceSchema.parse(snapshot.data());
        setExperience(validated);
      }
    });

    return () => unsubscribe();
  }, [eventId, experienceId]);

  return experience;
}

// Usage in component
function ExperienceBuilder({ eventId, experienceId }: Props) {
  const experience = usePhotoExperience(eventId, experienceId);

  if (!experience) return <LoadingSpinner />;

  return (
    <div>
      <p>Countdown: {experience.config.countdown ?? 0}s</p>
      <p>AI Enabled: {experience.aiConfig.enabled ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Task 5: Validate Input with Zod

```typescript
import { createPhotoExperienceSchema } from "@/features/experiences/lib/schemas";

function validateCreateInput(input: unknown) {
  try {
    const validated = createPhotoExperienceSchema.parse(input);
    console.log("Valid:", validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
    }
  }
}

// Example: Validation error
validateCreateInput({
  label: "",  // Too short!
  type: "photo",
});
// Output: Validation errors: [{ message: "Experience name is required", path: ["label"] }]
```

---

## File Structure

```
web/src/features/experiences/
├── lib/
│   ├── schemas.ts              # Zod schemas, TypeScript types
│   ├── schemas.test.ts         # Schema validation tests
│   ├── migration.ts            # Legacy → new schema migration
│   └── migration.test.ts       # Migration tests
├── actions/
│   ├── index.ts                # Barrel export (clean imports)
│   ├── types.ts                # ActionResponse, shared types
│   ├── photo-create.ts         # Server Action: create photo experience
│   ├── photo-update.ts         # Server Action: update photo experience
│   ├── photo-media.ts          # Server Action: media upload/delete
│   ├── shared.ts               # Server Action: delete experience (all types)
│   ├── utils.ts                # Helper functions (auth, validation)
│   └── legacy.ts               # Old actions (@deprecated)
└── components/
    └── shared/
        ├── CreateExperienceForm.tsx       # Create new experience UI
        ├── ExperienceTypeSelector.tsx     # Type selection with "coming soon"
        ├── ExperienceEditor.tsx           # Edit experience configuration
        └── ExperienceEditorWrapper.tsx    # Server Action wrapper
```

---

## Schema Definitions

### PhotoExperience (Full Type)

```typescript
interface PhotoExperience extends BaseExperience {
  type: "photo";
  config: PhotoConfig;
  aiConfig: AiConfig;
}

interface PhotoConfig {
  countdown: number;             // 0-10 seconds, 0 = disabled
  overlayFramePath: string | null;  // Public URL to overlay frame, null = no overlay
}

interface AiConfig {
  enabled: boolean;              // AI transformation on/off
  model: string | null;          // AI model ID (e.g., "flux-schnell"), null = no model
  prompt: string | null;         // Transformation prompt (max 600 chars), null = no prompt
  referenceImagePaths: string[] | null;  // Reference image URLs (max 5), null = no references
  aspectRatio: AspectRatio;      // Output aspect ratio (required)
}

type AspectRatio = "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
```

### Base Experience (Shared Fields)

```typescript
interface BaseExperience {
  id: string;
  eventId: string;
  label: string;                 // 1-50 characters
  type: ExperienceType;          // Discriminator
  enabled: boolean;
  hidden: boolean;               // Draft mode
  previewPath?: string;          // Preview image URL
  previewType?: "image" | "gif" | "video";
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
}
```

---

## Migration Examples

### Example 1: Legacy Experience (Before Migration)

```json
{
  "id": "exp_old123",
  "eventId": "evt_abc",
  "label": "Legacy Booth",
  "type": "photo",
  "enabled": true,
  "countdownEnabled": true,
  "countdownSeconds": 3,
  "overlayFramePath": "https://storage.googleapis.com/bucket/frames/vintage.png",
  "aiEnabled": true,
  "aiModel": "flux-schnell",
  "aiPrompt": "Vintage polaroid",
  "aiAspectRatio": "1:1",
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
}
```

### Example 2: Migrated Experience (After Save)

```json
{
  "id": "exp_old123",
  "eventId": "evt_abc",
  "label": "Legacy Booth",
  "type": "photo",
  "enabled": true,
  "hidden": false,
  "config": {
    "countdown": 3,
    "overlayFramePath": "https://storage.googleapis.com/bucket/frames/vintage.png"
  },
  "aiConfig": {
    "enabled": true,
    "model": "flux-schnell",
    "prompt": "Vintage polaroid",
    "aspectRatio": "1:1"
  },
  "createdAt": 1700000000000,
  "updatedAt": 1700010000000
}
```

**Removed Fields**: `countdownEnabled`, `countdownSeconds`, `overlayEnabled`, `aiEnabled`, `aiModel`, `aiPrompt`, `aiAspectRatio`

---

## Testing

### Unit Test: Schema Validation

```typescript
import { photoExperienceSchema } from "@/features/experiences/lib/schemas";

describe("photoExperienceSchema", () => {
  it("should validate photo experience with default config", () => {
    const data = {
      id: "exp_123",
      eventId: "evt_abc",
      label: "Test Booth",
      type: "photo",
      enabled: true,
      hidden: false,
      config: { countdown: 0 },
      aiConfig: { enabled: false, aspectRatio: "1:1" },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = photoExperienceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject invalid countdown range", () => {
    const data = {
      // ... other fields
      config: { countdown: 15 },  // Max is 10!
      aiConfig: { enabled: false, aspectRatio: "1:1" },
    };

    const result = photoExperienceSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

### Integration Test: Migration Logic

```typescript
import { migratePhotoExperience } from "@/features/experiences/lib/migration";

describe("migratePhotoExperience", () => {
  it("should migrate legacy countdown fields", () => {
    const legacy = {
      id: "exp_123",
      type: "photo",
      countdownEnabled: true,
      countdownSeconds: 5,
      aiEnabled: false,
      // ... other fields
    };

    const migrated = migratePhotoExperience(legacy);

    expect(migrated.config.countdown).toBe(5);
    expect(migrated.aiConfig.enabled).toBe(false);
    expect(migrated).not.toHaveProperty("countdownEnabled");
    expect(migrated).not.toHaveProperty("countdownSeconds");
  });
});
```

### Component Test: Create Experience Dialog

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateExperienceDialog } from "./create-experience-dialog";

describe("CreateExperienceDialog", () => {
  it("should show coming soon for non-photo types", () => {
    render(<CreateExperienceDialog eventId="evt_123" open={true} onOpenChange={jest.fn()} />);

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /video/i })).toBeDisabled();
  });
});
```

---

## FAQ

### Q: Do I need to manually migrate existing experiences?

**A**: No. The migration happens automatically when a user saves an experience via the builder UI. The `updatePhotoExperienceAction` detects legacy fields and migrates them to the new schema before applying updates.

### Q: Can I still read legacy experiences?

**A**: Yes. The UI components read from both old and new schemas (new schema takes precedence). This allows for a gradual migration without downtime.

### Q: What if I have both old and new fields in the same document?

**A**: The new schema fields (`config`, `aiConfig`) take precedence. When the document is saved, legacy fields are removed and all data is consolidated into the new schema.

### Q: How do I add a new experience type in the future?

**A**:
1. Define the type-specific config schema (e.g., `VideoConfig`)
2. Create the experience schema (e.g., `videoExperienceSchema`)
3. Add to the discriminated union in `experienceSchema`
4. Update UI to enable the type in the create dialog
5. Implement type-specific builder components

### Q: Why use `countdown: 0` instead of `countdownEnabled: false`?

**A**: Simplicity. Instead of tracking two fields (`countdownEnabled` + `countdownSeconds`), we use a single field where `0` means no countdown. This reduces redundancy and makes the schema cleaner.

### Q: What happens to `overlayEnabled`?

**A**: It's removed. The presence of `overlayFramePath` determines whether an overlay is enabled. If the field exists and has a URL, the overlay is enabled.

### Q: Can I use the same `aiConfig` structure for video experiences?

**A**: Yes! `aiConfig` is designed to be shared across photo, video, and gif experiences. Only the `config` object changes per type.

---

## Troubleshooting

### Error: "config is undefined"

**Cause**: Trying to access `experience.config` on a legacy document before migration.

**Solution**: Either migrate the document first, or handle both schemas:

```typescript
const countdown = experience.config?.countdown ?? experience.countdownSeconds ?? 0;
```

### Error: "Validation failed: type must be 'photo'"

**Cause**: Trying to create a non-photo experience (video, gif, etc.) when they're not yet implemented.

**Solution**: Only create photo experiences for now. Other types will be enabled in future releases.

### Error: "Property 'config' does not exist on type 'Experience'"

**Cause**: TypeScript doesn't know which experience type you're working with.

**Solution**: Use type narrowing:

```typescript
if (experience.type === "photo") {
  // TypeScript now knows: experience is PhotoExperience
  console.log(experience.config.countdown);
}
```

---

## Next Steps

1. **Read the Data Model**: See [data-model.md](./data-model.md) for complete type definitions
2. **Review Server Actions**: See [contracts/server-actions.md](./contracts/server-actions.md) for API details
3. **Check UI Components**: See [contracts/ui-components.md](./contracts/ui-components.md) for component contracts
4. **Run Tests**: Execute `pnpm test` to verify schema validation and migration logic
5. **Try It Out**: Create a new photo experience in the UI and inspect the Firestore document

---

## Additional Resources

- **Feature Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Implementation Tasks**: [tasks.md](./tasks.md) (generated by `/speckit.tasks`)
- **TypeScript Discriminated Unions**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
- **Zod Documentation**: https://zod.dev/
- **Firebase Best Practices**: `/standards/backend/firebase.md`
