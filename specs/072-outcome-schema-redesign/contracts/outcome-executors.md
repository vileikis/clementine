# Contract: Outcome Executors (Backend)

**Package**: `functions`
**Directory**: `functions/src/services/transform/outcomes/`

## Executor Registry

```typescript
// engine/runOutcome.ts
const outcomeRegistry: Record<OutcomeType, OutcomeExecutor | null> = {
  'photo':    photoOutcome,
  'gif':      null,          // Not implemented — Phase 2+
  'video':    null,          // Not implemented — Phase 2+
  'ai.image': aiImageOutcome,
  'ai.video': null,          // Not implemented — Phase 2+
}
```

## Dispatcher Behavior

```
runOutcome(ctx: OutcomeContext) → Promise<JobOutput>

1. Read outcome.type from ctx.snapshot.outcome
2. Reject if type is null → OutcomeError('INVALID_INPUT', 'No outcome type configured')
3. Look up executor in registry
4. Reject if executor is null → OutcomeError('INVALID_INPUT', 'Outcome type not implemented: {type}')
5. Execute and return JobOutput
```

## photoOutcome

**File**: `outcomes/photoOutcome.ts`
**Signature**: `(ctx: OutcomeContext) => Promise<JobOutput>`

```
Input: ctx.snapshot.outcome.photo (PhotoOutcomeConfig)
       ctx.snapshot.sessionResponses
       ctx.snapshot.overlayChoice

Flow:
1. Read photo config from snapshot.outcome.photo
2. Validate photo config exists → error if null
3. Get source media from sessionResponses using photo.captureStepId
4. Download source media to tmpDir
5. If overlayChoice exists → applyOverlay(outputPath, overlayChoice, tmpDir)
6. Upload output → return JobOutput
```

## aiImageOutcome

**File**: `outcomes/aiImageOutcome.ts`
**Signature**: `(ctx: OutcomeContext) => Promise<JobOutput>`

```
Input: ctx.snapshot.outcome.aiImage (AIImageOutcomeConfig)
       ctx.snapshot.sessionResponses
       ctx.snapshot.overlayChoice

Flow:
1. Read aiImage config from snapshot.outcome.aiImage
2. Validate aiImage config exists → error if null
3. Read imageGen = aiImage.imageGeneration
4. If task === 'image-to-image':
   → Get source media from sessionResponses using aiImage.captureStepId
   → Validate captureStepId is not null
5. If task === 'text-to-image':
   → sourceMedia = null
6. resolvePromptMentions(imageGen.prompt, sessionResponses, imageGen.refMedia)
7. aiGenerateImage({
     prompt: resolvedPrompt.text,
     model: imageGen.model,
     aspectRatio: imageGen.aspectRatio ?? aiImage.aspectRatio,
     sourceMedia,
     referenceMedia: resolvedPrompt.mediaRefs
   }, tmpDir)
8. If overlayChoice exists → applyOverlay(outputPath, overlayChoice, tmpDir)
9. Upload output → return JobOutput
```

## Shared Operations (unchanged)

- `resolvePromptMentions(prompt, sessionResponses, refMedia)` → `ResolvedPrompt`
- `aiGenerateImage(request: GenerationRequest, tmpDir)` → `GeneratedImage`
- `applyOverlay(outputPath, overlay, tmpDir)` → `string` (new output path)

## startTransformPipeline Changes

```
Current: Reads outcome.type, outcome.aiEnabled, outcome.captureStepId, etc.
New:     Reads outcome.type, then outcome[typeKey] for the active config.

Validation:
- Reject if outcome.type is null
- Reject if outcome.type is 'gif', 'video', or 'ai.video' (no executor)
- Reject if the active type's config is null (misconfiguration)

Snapshot building:
- outcome field in snapshot stores the FULL outcome object (all per-type configs)
- No structural change to JobSnapshot — just the outcome shape changes
```
