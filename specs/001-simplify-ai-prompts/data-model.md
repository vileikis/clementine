# Data Model: Simplify AI Prompts

**Feature**: 001-simplify-ai-prompts
**Date**: 2025-11-11
**Purpose**: Define data structures, validation rules, and state transitions

## Entity Changes

### Scene (Updated)

Firestore collection: `events/{eventId}/scenes/{sceneId}`

**Before**:
```typescript
interface Scene {
  id: string;
  label: string;
  mode: CaptureMode;
  effect: EffectType;              // ← DEPRECATED

  prompt: string;
  defaultPrompt: string;            // ← DEPRECATED

  referenceImagePath?: string;

  flags: {
    customTextTool: boolean;
    stickersTool: boolean;
  };

  status: SceneStatus;
  createdAt: number;
  updatedAt: number;
}

type EffectType = "background_swap" | "deep_fake";  // ← REMOVED
```

**After**:
```typescript
interface Scene {
  id: string;
  label: string;
  mode: CaptureMode;
  // effect field REMOVED

  prompt: string | null;            // ← Primary transformation field
  // defaultPrompt field REMOVED

  referenceImagePath?: string;      // Optional style reference

  flags: {
    customTextTool: boolean;
    stickersTool: boolean;
  };

  status: SceneStatus;
  createdAt: number;
  updatedAt: number;
}

// EffectType type REMOVED entirely
```

**Field Changes**:
- **REMOVED**: `effect: EffectType` - No longer needed, replaced by custom prompts
- **REMOVED**: `defaultPrompt: string` - User confirmed safe to delete
- **UPDATED**: `prompt: string` → `prompt: string | null` - Nullable for passthrough mode

**Validation Rules**:
```typescript
const SceneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  mode: z.enum(["photo", "video", "gif", "boomerang"]),

  prompt: z.string()
    .max(600, "Prompt must be 600 characters or less")
    .nullable(),

  referenceImagePath: z.string().optional(),

  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),

  status: z.enum(["active", "deprecated"]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});
```

**Behavioral Changes**:
- **Prompt empty/null**: Passthrough mode (copy input to result, no AI transformation)
- **Prompt non-empty**: AI transformation using custom prompt
- **Reference image**: Ignored if prompt is empty, used as style guide if prompt exists

---

### Session (No Changes)

Firestore collection: `events/{eventId}/sessions/{sessionId}`

```typescript
interface Session {
  id: string;
  eventId: string;
  sceneId: string;

  state: SessionState;

  inputImagePath?: string;
  resultImagePath?: string;

  error?: string;

  createdAt: number;
  updatedAt: number;
}

type SessionState = "created" | "captured" | "transforming" | "ready" | "error";
```

**No structural changes**, but state transition logic updated:
- **Passthrough mode**: "transforming" → "ready" (fast path, no AI call)
- **AI mode**: "transforming" → "ready" or "error" (existing behavior)

---

### TransformParams (Updated)

Internal type for AI provider interface.

**Before**:
```typescript
interface TransformParams {
  effect: EffectType;              // ← REMOVED
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
}
```

**After**:
```typescript
interface TransformParams {
  // effect field REMOVED
  prompt: string;                   // Now required, used directly
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
}
```

**Usage**:
- `prompt` is always passed directly from `scene.prompt`
- No template expansion or effect-based prompt building

---

## State Transitions

### Session State Machine

```
┌─────────┐
│ created │ Initial state when guest joins event
└────┬────┘
     │ capturePhoto()
     ▼
┌──────────┐
│ captured │ Photo uploaded to Storage
└────┬─────┘
     │ triggerTransform()
     ▼
┌──────────────┐
│ transforming │ AI processing or passthrough copy
└──────┬───────┘
       │
       ├─── Passthrough: prompt empty
       │    → copyImageToResult() (< 5s)
       │    ▼
       │   ┌───────┐
       └───│ ready │ Result available
       │   └───────┘
       │
       └─── AI Transform: prompt non-empty
            → AI provider call (< 60s)
            ▼
           ┌───────┐ Success
           │ ready │
           └───────┘
            ▼ Failure
           ┌───────┐
           │ error │ Error message stored
           └───────┘
```

**State Transition Rules**:
1. **created → captured**: Photo uploaded successfully
2. **captured → transforming**: Transform triggered
3. **transforming → ready**:
   - Passthrough: Input copied to result (prompt empty)
   - AI: Transformation successful (prompt non-empty)
4. **transforming → error**: AI transformation failed or timeout

---

## Validation Rules

### Scene Prompt Validation

**Client-Side** (`web/src/components/organizer/PromptEditor.tsx`):
```typescript
const form = useForm({
  resolver: zodResolver(SceneSchema.pick({ prompt: true })),
});

// Real-time character count
const promptLength = watchPrompt?.length ?? 0;
const isOverLimit = promptLength > 600;
```

**Server-Side** (`web/src/app/actions/scenes.ts`):
```typescript
export async function updateScene(formData: FormData) {
  const validated = SceneSchema.parse({
    prompt: formData.get("prompt"),
    // ...
  });

  // If validation fails, Zod throws with detailed errors
  // Next.js Server Actions handle error responses
}
```

**Validation Error Messages**:
- Empty prompt: Valid (passthrough mode)
- Prompt > 600 chars: "Prompt must be 600 characters or less"
- Invalid characters: No restrictions (all UTF-8 allowed)

### Reference Image Validation

**Existing validation** (no changes):
```typescript
const ReferenceImageSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, "File must be less than 10MB")
    .refine(
      file => ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "File must be PNG, JPEG, or WebP"
    ),
});
```

---

## Database Migrations

### Firestore Schema Changes

**No data migration required**:
- User confirmed all existing scenes already have `prompt` field populated
- `effect` and `defaultPrompt` fields can remain in database (ignored by code)
- New scenes will not write `effect` or `defaultPrompt` fields

**Gradual Deprecation Path**:
1. **Phase 1** (this feature): Remove fields from TypeScript types, mark as deprecated
2. **Phase 2** (future): Remove fields from UI and creation flows
3. **Phase 3** (future): Clean up existing documents (batch update to remove deprecated fields)

**Example Document After Migration**:
```json
{
  "id": "scene_abc123",
  "label": "Superhero Transform",
  "mode": "photo",
  "prompt": "Transform the person into a superhero with dramatic lighting",
  "referenceImagePath": "events/evt_123/scenes/scene_abc123/reference.jpg",
  "flags": {
    "customTextTool": false,
    "stickersTool": true
  },
  "status": "active",
  "createdAt": 1699564800000,
  "updatedAt": 1699564800000
}
```

Note: No `effect` or `defaultPrompt` fields present.

---

## Storage Paths

### Firebase Storage Structure

**No changes to path structure**:

```
events/{eventId}/
├── sessions/
│   └── {sessionId}/
│       ├── input.jpg           # Guest uploaded photo
│       └── result.jpg          # AI result OR passthrough copy
└── scenes/
    └── {sceneId}/
        └── reference.jpg       # Optional reference image
```

**Passthrough Copy Operation**:
- **Source**: `events/{eventId}/sessions/{sessionId}/input.jpg`
- **Destination**: `events/{eventId}/sessions/{sessionId}/result.jpg`
- **Method**: Firebase Storage `getBytes()` + `uploadBytes()` (or use Storage copy API if available)

---

## API Contracts

### Server Actions

#### `updateScene(formData: FormData)`

**Input**:
```typescript
{
  eventId: string;
  sceneId: string;
  prompt: string | null;          // Max 600 chars
  referenceImage?: File;          // Optional file upload
  // ... other scene fields
}
```

**Output**:
```typescript
{
  success: boolean;
  sceneId?: string;
  error?: string;
}
```

**Validation**:
- Prompt length ≤ 600 characters
- Reference image ≤ 10MB, type in [PNG, JPEG, WebP]

---

#### `triggerTransformAction(eventId: string, sessionId: string)`

**Updated Behavior**:

**Input**:
```typescript
{
  eventId: string;
  sessionId: string;
}
```

**Output** (unchanged):
```typescript
{
  success: boolean;
  resultImagePath?: string;
  error?: string;
}
```

**Logic Changes**:
```typescript
// Fetch scene
const scene = await getCurrentScene(eventId);

// PASSTHROUGH MODE: Empty prompt
if (!scene.prompt || scene.prompt.trim() === "") {
  // Copy input image to result location
  const resultImagePath = await copyImageToResult(
    session.inputImagePath,
    `events/${eventId}/sessions/${sessionId}/result.jpg`
  );

  // Mark session as ready (skip AI)
  await updateSessionState(eventId, sessionId, "ready", {
    resultImagePath,
  });

  return { success: true, resultImagePath };
}

// AI TRANSFORMATION MODE: Non-empty prompt
// ... existing AI transformation logic (unchanged)
```

---

### AI Provider Interface

#### `AIClient.generateImage(params: TransformParams)`

**Updated TransformParams**:
```typescript
interface TransformParams {
  prompt: string;                 // Direct from scene.prompt
  inputImageUrl: string;          // Signed URL
  referenceImageUrl?: string;     // Signed URL (optional)
  brandColor?: string;            // Hex color (optional)
}
```

**Provider Changes**:
- **Google AI**: Pass `prompt` directly to Gemini API text prompt
- **n8n**: Send `prompt` in webhook payload body
- **Mock**: Log `prompt` and return placeholder image

**Removed**: `buildPromptForEffect` function (no template expansion)

---

## Index Requirements

**No new indexes required**:
- Existing Firestore queries remain unchanged
- Scene queries by `eventId` and `status` (existing indexes)
- Session queries by `eventId` and `state` (existing indexes)

---

## Rollback Plan

**If issues arise**:

1. **Revert code changes**: Git revert to previous commit
2. **Restore UI**: Re-enable EffectPicker component
3. **Data impact**: None (no destructive database changes)

**Safe rollback window**: Indefinite (no breaking schema changes)

---

## Testing Data Requirements

### Test Scenes

**Scene with custom prompt**:
```json
{
  "id": "test_scene_custom",
  "prompt": "Transform into 1920s movie star with black and white styling",
  "referenceImagePath": "test/reference_vintage.jpg"
}
```

**Scene with empty prompt (passthrough)**:
```json
{
  "id": "test_scene_passthrough",
  "prompt": null,
  "referenceImagePath": null
}
```

**Scene with long prompt (edge case)**:
```json
{
  "id": "test_scene_long",
  "prompt": "A".repeat(600),  // Exactly 600 chars
}
```

**Scene with over-limit prompt (validation test)**:
```json
{
  "id": "test_scene_overlimit",
  "prompt": "A".repeat(601),  // Should fail validation
}
```

---

## Performance Metrics

### Target Latency

- **Passthrough mode**: < 5 seconds (FR-003)
- **AI transformation**: < 60 seconds (existing target)
- **Prompt validation**: < 100ms (client + server)

### Monitoring

**Existing metrics** (no changes):
- Session state distribution (created, captured, transforming, ready, error)
- Transformation success rate
- Average transformation duration

**New metric**:
- Passthrough mode usage (% of sessions with empty prompt)

---

## Summary of Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| **Scene.effect** | Removed | No longer needed, replaced by custom prompts |
| **Scene.defaultPrompt** | Removed | User confirmed safe to delete |
| **Scene.prompt** | Updated | Now nullable (null = passthrough mode) |
| **EffectType** | Removed | Type definition deleted |
| **TransformParams.effect** | Removed | AI providers use prompt directly |
| **buildPromptForEffect** | Removed | Function deleted (no template expansion) |
| **Session states** | Unchanged | State machine logic updated for passthrough |
| **Storage paths** | Unchanged | Passthrough uses existing paths |
| **Validation** | Added | 600 char limit on prompt (client + server) |
