# Research: Simplify AI Prompts

**Feature**: 001-simplify-ai-prompts
**Date**: 2025-11-11
**Purpose**: Resolve technical unknowns and document design decisions before implementation

## Research Questions

### 1. Passthrough Mode Implementation Strategy

**Question**: What is the best approach to implement passthrough mode (copy input photo to result when prompt is empty)?

**Decision**: Detect empty prompt in `triggerTransformAction` and copy input image to result location without calling AI providers.

**Rationale**:
- Early exit strategy minimizes latency (no AI API calls)
- Reuses existing Storage paths and patterns (`inputImagePath` → `resultImagePath`)
- Maintains consistent session state flow ("transforming" → "ready")
- Simple conditional: `if (!scene.prompt || scene.prompt.trim() === '')` → passthrough

**Alternatives Considered**:
- **Copy on capture**: Immediately copy input to result when photo is saved
  - Rejected: Breaks session state machine (session goes to "ready" without "transforming" state)
- **Provider-level passthrough**: Add passthrough logic to each AI provider
  - Rejected: Duplicates logic across providers, violates Single Responsibility
- **Storage-level mirroring**: Auto-mirror input to result at upload time
  - Rejected: Couples upload logic with transformation logic, reduces flexibility

**Implementation Notes**:
- Add `copyImageToResult` utility function in `web/src/lib/storage/upload.ts`
- Use Firebase Storage copy operations (no re-upload needed)
- Passthrough should complete in < 5 seconds (success criteria SC-003)

---

### 2. Prompt Validation Strategy

**Question**: How should we validate prompt length (600 char limit) on client and backend?

**Decision**: Use Zod schema validation on both client (form validation) and backend (Server Action input validation).

**Rationale**:
- Constitution Principle III requires Zod validation for all external inputs
- Client-side validation provides immediate UX feedback (no round-trip)
- Server-side validation is security-critical (clients can be bypassed)
- Zod schema can be shared between client and server for consistency

**Alternatives Considered**:
- **Client-only validation**: Rejected (not secure, can be bypassed)
- **Backend-only validation**: Rejected (poor UX, requires round-trip for simple errors)
- **HTML maxlength attribute**: Rejected (insufficient validation, no Zod integration)

**Implementation Notes**:
- Update `SceneSchema` in `web/src/lib/schemas/firestore.ts`:
  ```typescript
  prompt: z.string().max(600, "Prompt must be 600 characters or less").nullable()
  ```
- Use schema in PromptEditor component for client-side validation
- Use schema in `createScene`/`updateScene` Server Actions for backend validation

---

### 3. Legacy Effect Type Migration Path

**Question**: How should we handle existing scenes with `effect` and `defaultPrompt` fields?

**Decision**: Mark fields as deprecated (keep in type as optional), ignore in transformation logic, remove from UI/creation flows.

**Rationale**:
- User confirmed all existing events already have `prompt` field populated
- No data migration needed (existing data remains functional)
- Gradual deprecation path: remove from types after validating no production usage
- Zero-downtime migration (no breaking changes for existing scenes)

**Alternatives Considered**:
- **Immediate field deletion**: Rejected (risky, may break if any scenes don't have prompts)
- **Data migration script**: Rejected (user confirmed unnecessary, all prompts populated)
- **Keep both systems**: Rejected (increases complexity, violates YAGNI)

**Implementation Notes**:
- Phase 1: Mark `effect` and `defaultPrompt` as deprecated in types (add comments)
- Phase 2: Remove from UI components (EffectPicker deleted, prompt editor kept)
- Phase 3: Update transformation logic to ignore `effect`, only use `prompt`
- Phase 4: (Future) Remove deprecated fields from types after validation period

---

### 4. Reference Image Handling Without Prompt

**Question**: What should happen when reference images exist but prompt is empty?

**Decision**: Treat as passthrough mode (no AI transformation, copy input to result).

**Rationale**:
- User confirmed: "AI transformation is triggered only when prompt is present"
- Reference images without prompt have no semantic meaning (what transformation?)
- Simpler logic: single condition (`prompt` empty/null) determines passthrough
- Avoids ambiguity about default behavior

**Alternatives Considered**:
- **Use default prompt with reference images**: "Transform using this style"
  - Rejected: User explicitly stated no transformation when prompt is empty
- **Show validation error**: Reject reference image upload without prompt
  - Rejected: Adds unnecessary friction, user may add prompt later
- **Use reference image as result**: Copy reference image instead of input
  - Rejected: Doesn't match user expectation (guest's photo should be preserved)

**Implementation Notes**:
- No special handling needed for reference images in passthrough mode
- Reference images are simply ignored when `prompt` is empty
- Document this behavior in quickstart.md and component comments

---

### 5. AI Provider Prompt Integration

**Question**: How should AI providers receive and process custom prompts?

**Decision**: Pass `prompt` field directly to providers, remove `buildPromptForEffect` template function.

**Rationale**:
- Spec requirement FR-003: "use scene's prompt field directly without hardcoded templates"
- All providers (Google AI, n8n, mock) already accept `TransformParams.prompt`
- `buildPromptForEffect` only adds hardcoded templates based on `effect` type
- Removal simplifies AI pipeline and gives creators full control

**Alternatives Considered**:
- **Hybrid system**: Use templates if `effect` exists, prompt otherwise
  - Rejected: Increases complexity, violates Clean Code principle
- **Prompt enhancement**: Augment user prompts with quality hints
  - Rejected: Reduces creator control, may conflict with custom prompts
- **Provider-specific formatting**: Let each provider format prompts
  - Rejected: Inconsistent behavior across providers

**Implementation Notes**:
- Delete `web/src/lib/ai/prompts.ts` file entirely
- Update all providers to use `params.prompt` directly:
  - `google-ai.ts`: Pass prompt to Gemini API
  - `n8n-webhook.ts`: Send prompt in webhook payload
  - `mock.ts`: Log prompt and return mock image
- Update `TransformParams` type to make `prompt` required (not optional)

---

## Best Practices & Patterns

### Zod Validation Pattern

Clementine uses Zod for type-safe runtime validation (Constitution Principle III):

```typescript
// Define schema
const SceneSchema = z.object({
  prompt: z.string().max(600).nullable(),
  // ...
});

// Client-side (form validation)
const form = useForm({
  resolver: zodResolver(SceneSchema),
});

// Server-side (Server Action)
export async function updateScene(input: unknown) {
  const validated = SceneSchema.parse(input);
  // ...
}
```

### Firebase Storage Copy Pattern

For passthrough mode, use Firebase Storage's built-in copy operation:

```typescript
import { ref, getBytes, uploadBytes } from "firebase/storage";

async function copyImageToResult(inputPath: string, resultPath: string) {
  const inputRef = ref(storage, inputPath);
  const resultRef = ref(storage, resultPath);

  const bytes = await getBytes(inputRef);
  await uploadBytes(resultRef, bytes);

  return resultPath;
}
```

### Next.js Server Action Pattern

Clementine uses Server Actions for mutations (Constitution standard: `backend/api.md`):

```typescript
"use server";

export async function updateScene(formData: FormData) {
  // 1. Extract and validate input
  const validated = SceneSchema.parse({
    prompt: formData.get("prompt"),
  });

  // 2. Perform mutation
  await updateSceneInFirestore(validated);

  // 3. Revalidate affected paths
  revalidatePath(`/events/${eventId}/scene`);

  return { success: true };
}
```

---

## Dependencies & Integration Points

### Affected Systems

1. **Firestore Schema**: Scene document structure changes
   - Remove: `effect` field, `defaultPrompt` field
   - Validate: `prompt` field (600 char max)

2. **AI Transformation Pipeline**: `web/src/lib/ai/`
   - Remove: `buildPromptForEffect` function
   - Update: All providers to use `prompt` directly
   - Add: Passthrough mode detection

3. **Server Actions**: `web/src/app/actions/`
   - Update: `triggerTransformAction` for passthrough logic
   - Update: `createScene`/`updateScene` for prompt validation

4. **UI Components**: `web/src/components/organizer/`
   - Delete: `EffectPicker.tsx`
   - Update: `PromptEditor.tsx` for 600 char validation
   - Keep: `RefImageUploader.tsx` (no changes needed)

### External Dependencies

- **Firebase Storage**: Copy operation for passthrough mode
- **Firebase Firestore**: Scene document updates
- **AI Providers**: Google AI, n8n webhook (prompt parameter)

### Testing Requirements

- Unit tests for prompt validation (Zod schema)
- Unit tests for passthrough mode detection
- Integration tests for transformation flow with/without prompt
- Component tests for PromptEditor (char count, validation)

---

## Performance Considerations

### Passthrough Mode Latency

- **Target**: < 5 seconds (success criteria SC-003)
- **Strategy**: Skip AI provider calls, use Storage copy operation
- **Measurement**: Track `triggerTransformAction` duration for empty prompts

### Prompt Validation Performance

- **Client-side**: Zod validation is synchronous and fast (< 1ms)
- **Server-side**: Validation adds negligible latency (< 5ms)
- **Impact**: No measurable performance degradation expected

### AI Provider Changes

- **No impact**: Providers already handle variable-length prompts
- **Benefit**: Removing `buildPromptForEffect` reduces processing overhead

---

## Security & Privacy

### Prompt Content Validation

- **Length limit**: 600 characters (prevents abuse)
- **Server-side enforcement**: Required (clients can bypass client-side checks)
- **No content filtering**: User prompts accepted as-is (AI providers handle safety)

### Reference Image Access

- **No changes**: Existing Firebase Storage security rules apply
- **Signed URLs**: Continue using time-limited signed URLs for AI providers

### Passthrough Mode

- **No new security concerns**: Reuses existing Storage paths and access patterns
- **Data isolation**: Session images remain scoped to event/session

---

## Open Questions

None. All technical unknowns have been resolved through this research phase.
