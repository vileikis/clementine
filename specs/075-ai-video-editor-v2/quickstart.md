# Quickstart: AI Video Editor v2

**Branch**: `075-ai-video-editor-v2` | **Date**: 2026-02-22

## Prerequisites

```bash
git checkout 075-ai-video-editor-v2
pnpm install
```

## Development

```bash
# Start the app
pnpm app:dev

# Build shared package after schema changes
pnpm --filter @clementine/shared build

# Build functions after backend changes
pnpm functions:build
```

## Validation

```bash
# Type check + lint + format (all-in-one)
pnpm app:check

# Shared package tests (schema validation)
pnpm --filter @clementine/shared test

# Full type check
pnpm app:type-check
```

## Key Files to Modify

### Layer 1: Shared Schemas (start here)

| File | Change |
|------|--------|
| `packages/shared/src/schemas/experience/outcome.schema.ts` | Update task enum, add duration schema, add refMedia to videoGeneration config |

After schema changes, rebuild: `pnpm --filter @clementine/shared build`

### Layer 2: Frontend

| File | Change |
|------|--------|
| `apps/.../PromptComposer/PromptComposer.tsx` | Add modelOptions, duration, hideRefMedia props |
| `apps/.../PromptComposer/ControlRow.tsx` | Add optional duration picker |
| `apps/.../ai-video-config/AIVideoTaskSelector.tsx` | New task options + coming soon badges |
| `apps/.../ai-video-config/AIVideoConfigForm.tsx` | Replace VideoGenerationSection with PromptComposer |
| `apps/.../ai-video-config/VideoGenerationSection.tsx` | DELETE |
| `apps/.../ai-video-config/index.ts` | Remove VideoGenerationSection export |
| `apps/.../hooks/useRefMediaUpload.ts` | Add maxCount param |
| `apps/.../lib/model-options.ts` | Add DURATION_OPTIONS, MAX_VIDEO_REF_MEDIA_COUNT |
| `apps/.../lib/outcome-operations.ts` | Update defaults |

### Layer 3: Backend

| File | Change |
|------|--------|
| `functions/src/services/transform/outcomes/aiVideoOutcome.ts` | Task-based routing, refMedia passing |

## Testing Checklist

1. Open AI Video editor → verify 4 task options (2 active, 2 "coming soon")
2. Select Animate → verify PromptComposer with no ref media strip
3. Select Remix → verify PromptComposer with ref media strip (max 2)
4. Type @mention in prompt → verify step references work
5. Pick duration → verify only 4s, 6s, 8s options
6. Switch Animate ↔ Remix → verify ref media persists silently
7. Load legacy experience with `task: 'animate'` → verify it shows as "Animate"
8. Generate video (Animate) → verify correct API path
9. Generate video (Remix) → verify reference images sent correctly
10. Verify Photo and AI Image outcomes still work
