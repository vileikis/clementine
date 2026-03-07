# Quickstart: Error Capture & Safety Filter Reporting

**Feature**: 090-error-capture-safety-filters
**Date**: 2026-03-06

## Implementation Order

Changes should be made bottom-up: schemas first, then backend logic, then frontend.

### Phase 1: Schema Changes (shared package)

1. **`packages/shared/src/schemas/job/job.schema.ts`** — Add `details` field to `jobErrorSchema`
2. **`packages/shared/src/schemas/session/session.schema.ts`** — Add `jobErrorCode` field to `sessionSchema`
3. Build shared package: `pnpm --filter @clementine/shared build`

### Phase 2: Backend Infrastructure (functions)

4. **`functions/src/services/ai/providers/types.ts`** — Add `SAFETY_FILTERED` to `AiTransformErrorCode`, add `metadata` property to `AiTransformError`
5. **`functions/src/repositories/job.ts`** — Add `SAFETY_FILTERED` to `SANITIZED_ERROR_MESSAGES`, update `createSanitizedError` to accept optional `details`
6. **`functions/src/repositories/session.ts`** — Extend `updateSessionJobStatus` to accept optional `jobErrorCode`

### Phase 3: Error Capture (functions)

7. **`functions/src/services/transform/operations/aiGenerateVideo.ts`** — Capture RAI filter data in `extractVideoUri`, throw `AiTransformError` with `SAFETY_FILTERED` code
8. **`functions/src/services/transform/operations/aiGenerateImage.ts`** — Capture safety metadata in `extractImageFromResponse`, throw `AiTransformError` with `SAFETY_FILTERED` code

### Phase 4: Error Classification (functions)

9. **`functions/src/tasks/transformPipelineTask.ts`** — Update `handleJobFailure` to classify errors via `instanceof` checks and map to appropriate sanitized codes. Pass error metadata as `details`. Propagate error code to session.

### Phase 5: Frontend Display

10. **`apps/clementine-app/src/domains/guest/containers/SharePage.tsx`** — Read `jobErrorCode` from session, map to differentiated error messages

## Key Files

| File | Change |
|------|--------|
| `packages/shared/src/schemas/job/job.schema.ts` | Add `details` field |
| `packages/shared/src/schemas/session/session.schema.ts` | Add `jobErrorCode` field |
| `functions/src/services/ai/providers/types.ts` | Extend error code type + class |
| `functions/src/repositories/job.ts` | New error code + details param |
| `functions/src/repositories/session.ts` | Error code propagation |
| `functions/src/services/transform/operations/aiGenerateVideo.ts` | RAI filter capture |
| `functions/src/services/transform/operations/aiGenerateImage.ts` | Safety metadata capture |
| `functions/src/tasks/transformPipelineTask.ts` | Error classification logic |
| `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` | Differentiated messages |

## Verification

### Backend
```bash
pnpm --filter @clementine/shared build    # Shared schemas compile
pnpm functions:build                       # Functions compile with new types
```

### Frontend
```bash
pnpm app:type-check                        # Frontend compiles with new session field
pnpm app:build                             # Full build succeeds
```

### Manual Testing
- Trigger a safety-filtered video generation → verify job record has `SAFETY_FILTERED` code with filter reasons in `details`
- Trigger a safety-filtered image generation → verify same
- Trigger a provider error (e.g., rate limit) → verify `AI_MODEL_ERROR` code
- Check share page with `SAFETY_FILTERED` session → see content guidelines message
- Check share page with `TIMEOUT` session → see timeout message
- Check share page with generic failure → see "Something went wrong" message
