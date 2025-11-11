# Quickstart: Simplify AI Prompts

**Feature**: 001-simplify-ai-prompts
**Date**: 2025-11-11
**Purpose**: Developer guide for implementing and testing the feature

## Overview

This feature replaces hardcoded AI effect types (background_swap, deep_fake) with a flexible custom prompt system. Event creators can now define AI transformations using natural language prompts and optional reference images.

**Key Changes**:
- Remove `effect` field and `EffectType` enum
- Remove `defaultPrompt` field
- Make `prompt` field nullable (null = passthrough mode)
- Remove `buildPromptForEffect` template function
- Add passthrough mode (copy input to result when prompt is empty)

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project with Storage and Firestore

### Install Dependencies

```bash
# From repo root
pnpm install
```

### Environment Variables

No new environment variables needed. Existing AI provider configuration remains:

```bash
# .env.local
AI_PROVIDER=google-ai          # or 'n8n' or 'mock'
GOOGLE_AI_API_KEY=your_key     # Required if using google-ai
N8N_WEBHOOK_BASE_URL=...       # Required if using n8n
N8N_WEBHOOK_AUTH_TOKEN=...     # Optional
```

---

## Implementation Checklist

### Phase 1: Type Definitions

- [ ] Update `web/src/lib/types/firestore.ts`:
  - Remove `EffectType` type definition
  - Remove `effect: EffectType` from `Scene` interface
  - Remove `defaultPrompt: string` from `Scene` interface
  - Update `prompt: string` to `prompt: string | null`

- [ ] Update `web/src/lib/ai/types.ts`:
  - Remove `effect: EffectType` from `TransformParams`
  - Keep `prompt: string` (required field)

### Phase 2: Validation Schemas

- [ ] Update `web/src/lib/schemas/firestore.ts`:
  - Update `SceneSchema`:
    ```typescript
    prompt: z.string()
      .max(600, "Prompt must be 600 characters or less")
      .nullable()
    ```
  - Remove any references to `effect` or `defaultPrompt` fields

### Phase 3: AI Transformation Logic

- [ ] Delete `web/src/lib/ai/prompts.ts`:
  - Remove entire file (contains `buildPromptForEffect`)

- [ ] Update `web/src/lib/ai/providers/google-ai.ts`:
  - Remove `buildPromptForEffect` import
  - Use `params.prompt` directly in API call

- [ ] Update `web/src/lib/ai/providers/n8n-webhook.ts`:
  - Remove `buildPromptForEffect` import
  - Pass `params.prompt` directly in webhook payload

- [ ] Update `web/src/lib/ai/providers/mock.ts`:
  - Remove `buildPromptForEffect` import
  - Log `params.prompt` directly

### Phase 4: Passthrough Mode

- [ ] Add `web/src/lib/storage/upload.ts`:
  ```typescript
  export async function copyImageToResult(
    inputPath: string,
    resultPath: string
  ): Promise<string> {
    const storage = getStorage();
    const inputRef = ref(storage, inputPath);
    const resultRef = ref(storage, resultPath);

    const bytes = await getBytes(inputRef);
    await uploadBytes(resultRef, bytes);

    return resultPath;
  }
  ```

- [ ] Update `web/src/app/actions/sessions.ts`:
  - Add passthrough mode detection in `triggerTransformAction`:
    ```typescript
    // Check for passthrough mode
    if (!scene.prompt || scene.prompt.trim() === "") {
      const resultImagePath = await copyImageToResult(
        session.inputImagePath,
        `events/${eventId}/sessions/${sessionId}/result.jpg`
      );

      await updateSessionState(eventId, sessionId, "ready", {
        resultImagePath,
      });

      return { success: true, resultImagePath };
    }

    // Continue with AI transformation...
    ```

### Phase 5: UI Components

- [ ] Delete `web/src/components/organizer/EffectPicker.tsx`:
  - Remove entire file (predefined effect selector)

- [ ] Update `web/src/components/organizer/PromptEditor.tsx`:
  - Add character count display (X / 600)
  - Add validation error for > 600 chars
  - Ensure mobile-friendly (appropriate keyboard type)

- [ ] Update `web/src/app/events/[eventId]/scene/page.tsx`:
  - Remove `<EffectPicker />` component
  - Keep `<PromptEditor />` and `<RefImageUploader />`

### Phase 6: Server Actions

- [ ] Update `web/src/app/actions/scenes.ts`:
  - Remove `effect` parameter from `createScene`
  - Remove `effect` parameter from `updateScene`
  - Remove `defaultPrompt` handling
  - Ensure prompt validation uses updated schema

### Phase 7: Repository Layer

- [ ] Update `web/src/lib/repositories/scenes.ts`:
  - Remove `defaultPrompt` field handling
  - Ensure `prompt` field is properly saved/loaded

### Phase 8: Tests

- [ ] Update `web/src/lib/repositories/scenes.test.ts`:
  - Remove tests for `effect` field
  - Remove tests for `defaultPrompt` field
  - Add test: Create scene with custom prompt
  - Add test: Create scene with null prompt (passthrough)
  - Add test: Validate prompt > 600 chars fails

- [ ] Update `web/src/lib/repositories/sessions.test.ts`:
  - Add test: Passthrough mode (empty prompt) copies input to result
  - Add test: AI mode (non-empty prompt) calls AI provider

- [ ] Add `web/src/lib/storage/upload.test.ts`:
  - Add test: `copyImageToResult` successfully copies image

---

## Testing Guide

### Manual Testing

#### Test 1: Custom Prompt AI Transformation

1. Create a new scene with custom prompt:
   ```
   Prompt: "Transform into a 1920s silent film star with black and white styling"
   Reference Image: (optional vintage photo)
   ```

2. As a guest, upload a photo
3. Verify AI transformation uses the custom prompt
4. Expected: Result reflects 1920s styling

#### Test 2: Passthrough Mode

1. Create a new scene with empty prompt:
   ```
   Prompt: (leave empty or set to null)
   ```

2. As a guest, upload a photo
3. Verify result is identical to input photo
4. Expected: No AI transformation, < 5 seconds to complete

#### Test 3: Prompt Validation

1. Attempt to create scene with 601-character prompt
2. Expected: Validation error "Prompt must be 600 characters or less"
3. Try with exactly 600 characters
4. Expected: Success

#### Test 4: Reference Image Without Prompt

1. Create scene with reference image but empty prompt
2. As a guest, upload a photo
3. Expected: Passthrough mode (input copied to result, reference image ignored)

#### Test 5: Existing Scene Migration

1. Find an existing scene with `effect: "background_swap"` or `effect: "deep_fake"`
2. As a guest, upload a photo
3. Verify transformation uses the scene's `prompt` field (not effect type)
4. Expected: Existing scenes work without changes

### Automated Testing

Run the full test suite:

```bash
# From repo root
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test --coverage
```

**Expected Coverage**:
- Overall: 70%+
- Critical paths (scene creation, transformation, passthrough): 90%+

---

## Validation Loop

Before marking the feature complete, run the validation loop:

```bash
# 1. Lint
pnpm lint
# Expected: No errors

# 2. Type check
pnpm type-check
# Expected: No errors

# 3. Run tests
pnpm test
# Expected: All tests pass

# 4. Manual verification
pnpm dev
# Test in browser (localhost:3000)
```

---

## Deployment Checklist

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Manual testing complete
- [ ] No console errors in browser
- [ ] Mobile testing complete (320px viewport)
- [ ] Constitution compliance verified
- [ ] Documentation updated

---

## Rollback Plan

If issues are discovered after deployment:

1. **Revert Git commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **No data migration needed**: Existing scenes remain functional

3. **UI fallback**: Old code with EffectPicker can be restored

4. **Safe window**: Indefinite (no breaking database changes)

---

## Common Issues & Solutions

### Issue: Passthrough mode not working

**Symptom**: Empty prompt scenes still attempt AI transformation

**Solution**:
- Check passthrough detection logic in `triggerTransformAction`:
  ```typescript
  if (!scene.prompt || scene.prompt.trim() === "") {
    // Should enter passthrough mode
  }
  ```
- Verify `scene.prompt` is actually `null` or empty string in database

### Issue: Prompt validation not triggering

**Symptom**: Prompts > 600 chars are accepted

**Solution**:
- Ensure `SceneSchema` is imported and used in Server Actions:
  ```typescript
  const validated = SceneSchema.parse(input);
  ```
- Check client-side validation in PromptEditor component

### Issue: AI providers failing after changes

**Symptom**: All AI transformations fail with error

**Solution**:
- Verify `buildPromptForEffect` import is removed from all providers
- Check that `params.prompt` is being passed correctly to AI APIs
- Test with mock provider first to isolate issue

### Issue: Existing scenes not working

**Symptom**: Old scenes with `effect` field fail to transform

**Solution**:
- Verify existing scenes have `prompt` field populated
- Check database for missing `prompt` values
- Ensure transformation logic ignores `effect` field

---

## Performance Monitoring

### Metrics to Track

**Passthrough Mode**:
- Average duration (target: < 5 seconds)
- Success rate (target: 100%)
- Usage percentage (% of sessions with empty prompt)

**AI Transformation**:
- Average duration (existing target: < 60 seconds)
- Success rate (existing target: > 95%)
- Prompt length distribution

**Validation**:
- Client-side validation errors (prompt > 600 chars)
- Server-side validation errors

### Logging

Add structured logging for debugging:

```typescript
console.log("[Transform]", {
  mode: scene.prompt ? "ai" : "passthrough",
  promptLength: scene.prompt?.length ?? 0,
  hasReference: !!scene.referenceImagePath,
  duration: Date.now() - startTime,
});
```

---

## Next Steps

After this feature is complete:

1. **Monitor production usage**:
   - Track passthrough mode adoption
   - Collect user feedback on custom prompts

2. **Future enhancements**:
   - Prompt templates library (optional)
   - Multi-reference image support
   - Prompt preview/testing tool

3. **Cleanup tasks**:
   - Remove `effect` and `defaultPrompt` fields from database (batch job)
   - Archive old EffectPicker component
   - Update user documentation

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/server-actions.md](./contracts/server-actions.md)
- **Research**: [research.md](./research.md)
- **Constitution**: `.specify/memory/constitution.md`
- **Standards**: `sdd/standards/`

---

## Support

For questions or issues during implementation:

1. Review research.md for design decisions
2. Check data-model.md for schema details
3. Consult contracts/ for API specifications
4. Reference constitution.md for standards compliance

This feature reduces codebase complexity and gives event creators full control over AI transformations. Happy coding!
