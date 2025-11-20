# Developer Quickstart: Multi-Experience Type Editor

**Feature**: 004-multi-experience-editor
**Audience**: Developers implementing or extending this feature
**Last Updated**: 2025-11-20

---

## Overview

This guide helps you understand and work with the multi-experience type editor architecture. The feature enables event creators to create and edit different experience types (Photo, GIF, Video, Wheel, Survey) while maximizing code reuse for shared functionality.

**Key Concepts**:
- **Discriminated Union**: TypeScript pattern where `type` field determines structure
- **Type-Specific Components**: Separate editor for each experience type
- **Shared Components**: Common UI (label, enabled, preview, delete, AI settings)
- **Type-Safe Updates**: Separate Zod schemas for each experience type

---

## Quick Reference

### File Locations

```
web/src/features/experiences/
├── actions/
│   ├── shared.ts                    # Delete (works for all types)
│   ├── photo-create.ts              # Photo creation
│   ├── photo-update.ts              # Photo updates
│   ├── gif-create.ts                # GIF creation (NEW)
│   └── gif-update.ts                # GIF updates (NEW)
├── components/
│   ├── shared/
│   │   ├── ExperienceEditor.tsx            # Wrapper with switch routing
│   │   ├── ExperienceEditorWrapper.tsx     # Server action binding
│   │   ├── BaseExperienceFields.tsx        # Shared label/enabled/preview (NEW)
│   │   ├── DeleteExperienceButton.tsx      # Shared delete logic (NEW)
│   │   └── PreviewMediaUpload.tsx          # Preview media uploader
│   ├── photo/
│   │   ├── PhotoExperienceEditor.tsx       # Photo editor (NEW)
│   │   ├── AITransformSettings.tsx         # AI config (moved to shared)
│   │   ├── CountdownSettings.tsx           # Countdown UI
│   │   └── OverlaySettings.tsx             # Overlay frame UI
│   └── gif/
│       ├── GifExperienceEditor.tsx         # GIF editor (NEW)
│       └── GifCaptureSettings.tsx          # Frame/interval/loop UI (NEW)
├── lib/
│   ├── schemas.ts                   # Discriminated union, update schemas
│   └── repository.ts                # Firestore data access
└── index.ts                         # Public exports
```

---

## Architecture Overview

### Component Hierarchy

```
Page: /events/[eventId]/design/experiences/[experienceId]
  └─ ExperienceEditorWrapper (binds Server Actions)
       └─ ExperienceEditor (wrapper with switch-case routing)
            ├─ PhotoExperienceEditor (when type === "photo")
            │    ├─ BaseExperienceFields (shared)
            │    ├─ PreviewMediaUpload (shared)
            │    ├─ CountdownSettings (photo-specific)
            │    ├─ OverlaySettings (photo-specific)
            │    ├─ AITransformSettings (shared with GIF)
            │    └─ DeleteExperienceButton (shared)
            │
            └─ GifExperienceEditor (when type === "gif")
                 ├─ BaseExperienceFields (shared)
                 ├─ PreviewMediaUpload (shared)
                 ├─ GifCaptureSettings (GIF-specific)
                 ├─ AITransformSettings (shared with Photo)
                 └─ DeleteExperienceButton (shared)
```

### Type Flow

```
1. Repository fetches Experience (discriminated union)
2. Wrapper component receives Experience prop
3. Wrapper uses switch on experience.type
4. TypeScript narrows to specific type (PhotoExperience | GifExperience)
5. Type-specific component receives narrowed type as prop
6. Component edits type-specific config
7. Server Action validates with type-specific schema
8. Firestore updated via Admin SDK
```

---

## Adding a New Experience Type (Example: Video)

Follow these steps to add Video experience support:

### Step 1: Define Schemas (Already Exists)

The schema is already defined in `schemas.ts`:

```typescript
// web/src/features/experiences/lib/schemas.ts

export const videoExperienceSchema = baseExperienceSchema.extend({
  type: z.literal("video"),
  config: videoConfigSchema,
  aiConfig: aiConfigSchema,
});

export type VideoExperience = z.infer<typeof videoExperienceSchema>;
```

### Step 2: Create Update Schemas

```typescript
// web/src/features/experiences/lib/schemas.ts

export const createVideoExperienceSchema = z.object({
  label: z.string().trim().min(1).max(50),
  type: z.literal("video"),
});

export const updateVideoExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  config: videoConfigSchema.partial().optional(),
  aiConfig: aiConfigSchema.partial().optional(),
}).strict();

export type CreateVideoExperienceData = z.infer<typeof createVideoExperienceSchema>;
export type UpdateVideoExperienceData = z.infer<typeof updateVideoExperienceSchema>;
```

### Step 3: Create Server Actions

```typescript
// web/src/features/experiences/actions/video-create.ts

'use server';

import { createVideoExperienceSchema, type VideoExperience } from '../lib/schemas';
import type { ActionResponse } from '@/lib/types';

export async function createVideoExperience(
  eventId: string,
  data: CreateVideoExperienceData
): Promise<ActionResponse<VideoExperience>> {
  try {
    const validated = createVideoExperienceSchema.parse(data);

    // Create in Firestore with defaults
    const experienceId = await createExperienceInFirestore(eventId, {
      ...validated,
      type: 'video' as const,
      enabled: true,
      hidden: false,
      config: {
        maxDurationSeconds: 15,
        allowRetake: true,
        countdown: 3,
      },
      aiConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: '1:1',
      },
    });

    const experience = await getExperienceById(eventId, experienceId);
    return { success: true, data: experience as VideoExperience };
  } catch (error) {
    return handleError(error);
  }
}
```

```typescript
// web/src/features/experiences/actions/video-update.ts

'use server';

import { updateVideoExperienceSchema, type VideoExperience } from '../lib/schemas';
import type { ActionResponse } from '@/lib/types';

export async function updateVideoExperience(
  eventId: string,
  experienceId: string,
  data: UpdateVideoExperienceData
): Promise<ActionResponse<VideoExperience>> {
  try {
    const validated = updateVideoExperienceSchema.parse(data);
    await updateExperienceInFirestore(eventId, experienceId, validated);

    const experience = await getExperienceById(eventId, experienceId);
    return { success: true, data: experience as VideoExperience };
  } catch (error) {
    return handleError(error);
  }
}
```

### Step 4: Create Editor Component

```typescript
// web/src/features/experiences/components/video/VideoExperienceEditor.tsx

'use client';

import { useState, useTransition } from 'react';
import { BaseExperienceFields } from '../shared/BaseExperienceFields';
import { PreviewMediaUpload } from '../shared/PreviewMediaUpload';
import { VideoRecordingSettings } from './VideoRecordingSettings';
import { AITransformSettings } from '../shared/AITransformSettings';
import { DeleteExperienceButton } from '../shared/DeleteExperienceButton';
import type { VideoExperience } from '../../lib/schemas';

interface VideoExperienceEditorProps {
  experience: VideoExperience;
  onSave: (experienceId: string, data: Partial<VideoExperience>) => Promise<void>;
  onDelete: (experienceId: string) => Promise<void>;
}

export function VideoExperienceEditor({
  experience,
  onSave,
  onDelete,
}: VideoExperienceEditorProps) {
  const [isPending, startTransition] = useTransition();

  // Local state
  const [label, setLabel] = useState(experience.label);
  const [enabled, setEnabled] = useState(experience.enabled);
  const [previewPath, setPreviewPath] = useState(experience.previewPath || '');
  const [previewType, setPreviewType] = useState(experience.previewType);

  // Video config
  const [maxDuration, setMaxDuration] = useState(experience.config.maxDurationSeconds);
  const [allowRetake, setAllowRetake] = useState(experience.config.allowRetake);
  const [countdown, setCountdown] = useState(experience.config.countdown || 0);

  // AI config
  const [aiEnabled, setAiEnabled] = useState(experience.aiConfig.enabled);
  const [aiModel, setAiModel] = useState(experience.aiConfig.model || 'nanobanana');
  const [aiPrompt, setAiPrompt] = useState(experience.aiConfig.prompt || '');
  const [aiReferenceImagePaths, setAiReferenceImagePaths] = useState(
    experience.aiConfig.referenceImagePaths || []
  );
  const [aiAspectRatio, setAiAspectRatio] = useState(experience.aiConfig.aspectRatio);

  const handleSave = () => {
    if (isPending) return;
    startTransition(async () => {
      await onSave(experience.id, {
        label,
        enabled,
        previewPath: previewPath || undefined,
        previewType: previewType || undefined,
        config: {
          maxDurationSeconds: maxDuration,
          allowRetake,
          countdown,
        },
        aiConfig: {
          enabled: aiEnabled,
          model: aiModel || null,
          prompt: aiPrompt || null,
          referenceImagePaths: aiReferenceImagePaths.length > 0 ? aiReferenceImagePaths : null,
          aspectRatio: aiAspectRatio,
        },
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Enable/Delete */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Video Experience</h2>
        <div className="flex items-center gap-3">
          <DeleteExperienceButton
            experienceLabel={experience.label}
            onDelete={() => onDelete(experience.id)}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Shared Fields */}
      <BaseExperienceFields
        label={label}
        enabled={enabled}
        onLabelChange={setLabel}
        onEnabledChange={setEnabled}
        disabled={isPending}
      />

      {/* Preview Media */}
      <PreviewMediaUpload
        experienceType="video"
        eventId={experience.eventId}
        experienceId={experience.id}
        previewPath={previewPath}
        previewType={previewType}
        onUpload={(url, type) => {
          setPreviewPath(url);
          setPreviewType(type);
        }}
        onRemove={() => {
          setPreviewPath('');
          setPreviewType(undefined);
        }}
        disabled={isPending}
      />

      {/* Video-Specific Settings */}
      <VideoRecordingSettings
        maxDurationSeconds={maxDuration}
        allowRetake={allowRetake}
        countdown={countdown}
        onMaxDurationChange={setMaxDuration}
        onAllowRetakeChange={setAllowRetake}
        onCountdownChange={setCountdown}
        disabled={isPending}
      />

      {/* AI Transform */}
      {aiEnabled && (
        <AITransformSettings
          aiModel={aiModel}
          aiPrompt={aiPrompt}
          aiReferenceImagePaths={aiReferenceImagePaths}
          aiAspectRatio={aiAspectRatio}
          onAiModelChange={setAiModel}
          onAiPromptChange={setAiPrompt}
          onAiReferenceImagePathsChange={setAiReferenceImagePaths}
          onAiAspectRatioChange={setAiAspectRatio}
          disabled={isPending}
        />
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
```

### Step 5: Add to Wrapper Switch

```typescript
// web/src/features/experiences/components/shared/ExperienceEditor.tsx

export function ExperienceEditor({ experience, onSave, onDelete }: ExperienceEditorProps) {
  switch (experience.type) {
    case 'photo':
      return <PhotoExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'gif':
      return <GifExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'video': // ADD THIS CASE
      return <VideoExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'wheel':
      return <WheelExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    case 'survey':
      return <SurveyExperienceEditor experience={experience} onSave={onSave} onDelete={onDelete} />;
    default:
      const _exhaustive: never = experience;
      return null;
  }
}
```

**That's it!** Video experience editing now works. Total lines added: ~150 (most is UI-specific).

---

## Common Patterns

### Pattern 1: Type Narrowing in Switch

```typescript
const experience: Experience = await getExperienceById(eventId, expId);

switch (experience.type) {
  case 'photo':
    // TypeScript knows: experience is PhotoExperience
    console.log(experience.config.countdown); // OK
    console.log(experience.config.frameCount); // Error: doesn't exist on PhotoExperience
    break;

  case 'gif':
    // TypeScript knows: experience is GifExperience
    console.log(experience.config.frameCount); // OK
    console.log(experience.config.countdown); // OK (optional field)
    break;
}
```

### Pattern 2: Shared Component with Type Awareness

```typescript
interface PreviewMediaUploadProps {
  experienceType: ExperienceType; // Use type discriminant, not full experience
  eventId: string;
  experienceId: string;
  // ...
}

export function PreviewMediaUpload(props: PreviewMediaUploadProps) {
  const acceptedTypes =
    props.experienceType === 'photo' ? 'image/*' :
    props.experienceType === 'video' ? 'video/*' :
    'image/*,video/*';

  return <input type="file" accept={acceptedTypes} />;
}
```

### Pattern 3: Partial Update Schema

```typescript
// WRONG: Makes discriminant optional
Partial<PhotoExperience> // Bad

// RIGHT: Update schema without discriminant
const updatePhotoExperienceSchema = z.object({
  label: z.string().optional(),
  config: photoConfigSchema.partial().optional(),
  // ... no 'type' field
}).strict();
```

### Pattern 4: Exhaustiveness Checking

```typescript
function getExperienceIcon(type: ExperienceType): string {
  switch (type) {
    case 'photo': return '📷';
    case 'video': return '🎥';
    case 'gif': return '🎞️';
    case 'wheel': return '🎡';
    case 'survey': return '📋';
    default:
      // Compile error if case missing
      const _exhaustive: never = type;
      return '';
  }
}
```

---

## Testing Guidelines

### Unit Tests for Wrapper Routing

```typescript
// web/src/features/experiences/components/shared/ExperienceEditor.test.tsx

import { render, screen } from '@testing-library/react';
import { ExperienceEditor } from './ExperienceEditor';
import { PhotoExperience, GifExperience } from '../../lib/schemas';

describe('ExperienceEditor', () => {
  it('renders PhotoExperienceEditor for photo type', () => {
    const photoExp: PhotoExperience = {
      id: 'exp_1',
      eventId: 'evt_1',
      type: 'photo',
      label: 'Test Photo',
      // ... full valid photo experience
    };

    render(<ExperienceEditor experience={photoExp} onSave={jest.fn()} onDelete={jest.fn()} />);

    // Check photo-specific UI renders
    expect(screen.getByText('Countdown Timer')).toBeInTheDocument();
    expect(screen.getByText('Overlay Frame')).toBeInTheDocument();
  });

  it('renders GifExperienceEditor for gif type', () => {
    const gifExp: GifExperience = {
      id: 'exp_2',
      eventId: 'evt_1',
      type: 'gif',
      label: 'Test GIF',
      // ... full valid GIF experience
    };

    render(<ExperienceEditor experience={gifExp} onSave={jest.fn()} onDelete={jest.fn()} />);

    // Check GIF-specific UI renders
    expect(screen.getByText('Frame Count')).toBeInTheDocument();
    expect(screen.getByText('Interval')).toBeInTheDocument();
  });
});
```

### Unit Tests for Type-Specific Editors

```typescript
// web/src/features/experiences/components/gif/GifExperienceEditor.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GifExperienceEditor } from './GifExperienceEditor';
import { GifExperience } from '../../lib/schemas';

describe('GifExperienceEditor', () => {
  const mockGifExp: GifExperience = {
    id: 'exp_1',
    eventId: 'evt_1',
    type: 'gif',
    label: 'Test GIF',
    enabled: true,
    hidden: false,
    config: {
      frameCount: 5,
      intervalMs: 500,
      loopCount: 0,
      countdown: 3,
    },
    aiConfig: {
      enabled: false,
      model: null,
      prompt: null,
      referenceImagePaths: null,
      aspectRatio: '1:1',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('calls onSave with updated config when Save clicked', async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);

    render(<GifExperienceEditor experience={mockGifExp} onSave={mockSave} onDelete={jest.fn()} />);

    // Change frame count
    const frameCountInput = screen.getByLabelText('Frame Count');
    fireEvent.change(frameCountInput, { target: { value: '8' } });

    // Click save
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('exp_1', {
        label: 'Test GIF',
        enabled: true,
        config: {
          frameCount: 8, // Changed
          intervalMs: 500,
          loopCount: 0,
          countdown: 3,
        },
        // ... ai config
      });
    });
  });
});
```

---

## Troubleshooting

### TypeScript Error: "Property does not exist on type Experience"

**Problem**:
```typescript
const experience: Experience = getExperience();
console.log(experience.config.countdown); // Error: Property 'countdown' does not exist
```

**Solution**: Use type narrowing with switch or type guard:
```typescript
if (experience.type === 'photo') {
  console.log(experience.config.countdown); // OK
}
```

### Zod Validation Error: "Invalid discriminator value"

**Problem**: Trying to update `type` field.

**Solution**: Don't include `type` in update schemas. The discriminant is immutable.

### Component Not Rendering After Adding New Type

**Problem**: Added new experience type but editor shows nothing.

**Solution**: Check that you added the case to the switch statement in `ExperienceEditor.tsx`. TypeScript's exhaustiveness check should catch this at compile time.

---

## Best Practices

1. **Always use type narrowing** - Don't bypass with `as` casts
2. **Shared components accept simple props** - Not full experience objects
3. **Update schemas exclude discriminant** - Type field never changes
4. **Validate at Server Action boundary** - Client validation is optional
5. **Extract common UI** - If code appears in 2+ editors, extract to shared
6. **Test wrapper routing** - Ensure correct editor renders for each type
7. **Use exhaustiveness checks** - `default: never` catches missing cases

---

## Resources

- [Full Implementation Plan](./plan.md)
- [Research: Discriminated Union Patterns](./research.md)
- [Data Model Documentation](./data-model.md)
- [API Contracts](./contracts/repository-contracts.md)
- [TypeScript Handbook: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Zod Discriminated Unions](https://zod.dev/?id=discriminated-unions)

---

## Getting Help

**Common Questions**:
- How do I add a new experience type? → See "Adding a New Experience Type" section above
- How do I share UI between types? → Extract to shared component, pass simple props
- How do I test type narrowing? → Check type-specific UI renders in unit tests
- How do I handle partial updates? → Use type-specific update schemas without discriminant

**Code References**:
- Wrapper component: `web/src/features/experiences/components/shared/ExperienceEditor.tsx`
- Photo editor example: `web/src/features/experiences/components/photo/PhotoExperienceEditor.tsx`
- GIF editor example: `web/src/features/experiences/components/gif/GifExperienceEditor.tsx`
- Schemas: `web/src/features/experiences/lib/schemas.ts`
