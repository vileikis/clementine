# Quickstart: AI Video Editor

**Branch**: `073-ai-video-editor` | **Date**: 2026-02-19

## Prerequisites

- Phase 1 (072-outcome-schema-redesign) complete and merged to main
- Node.js, pnpm 10.18.1 installed
- Firebase project configured

## Setup

```bash
# From monorepo root
git checkout 073-ai-video-editor
pnpm install

# Build shared package first (has schema changes)
pnpm --filter @clementine/shared build

# Start dev server
pnpm app:dev
```

## Development Workflow

### 1. Schema Change (shared package)

```bash
# Edit the file
# packages/shared/src/schemas/experience/outcome.schema.ts
# - Export aiVideoTaskSchema and AIVideoTask type
# - Add aiVideoModelSchema enum (veo-3.1-generate-001, veo-3.1-fast-generate-001)
# - Update videoGenerationConfigSchema.model to use aiVideoModelSchema

# Rebuild shared package
pnpm --filter @clementine/shared build
```

### 2. Frontend Changes (app)

All UI changes are in:
```
apps/clementine-app/src/domains/experience/create/
```

Key files to modify:
- `lib/model-options.ts` — Enable AI Video, add video model constants
- `lib/outcome-operations.ts` — Add `createDefaultAIVideoConfig`, update `initializeOutcomeType`
- `hooks/useOutcomeValidation.ts` — Add AI Video validation rules
- `hooks/useRefMediaUpload.ts` — Generalize to accept `currentRefMedia`
- `components/CreateTabForm.tsx` — Add AI Video render branch + handler
- `components/outcome-picker/OutcomeTypePicker.tsx` — Enable AI Video card
- `components/outcome-picker/OutcomeTypeSelector.tsx` — Add AI Video toggle

New files to create:
- `components/ai-video-config/AIVideoConfigForm.tsx`
- `components/ai-video-config/AIVideoTaskSelector.tsx`
- `components/ai-video-config/VideoGenerationSection.tsx`
- `components/ai-video-config/FrameGenerationSection.tsx`

### 3. Validation

```bash
# Type check
pnpm app:type-check

# Lint + format
pnpm app:check

# Run tests
pnpm app:test
```

### 4. Manual Testing

1. Open experience designer
2. Click output type picker → select AI Video
3. Verify smart defaults (animate task, 9:16, 5s duration)
4. Switch between tasks → verify config persistence
5. Configure frame generation (transform/reimagine) → verify mentions and ref media
6. Switch to Photo → switch back → verify AI Video config preserved
7. Verify Photo and AI Image still work (no regressions)

## Key Patterns to Follow

| Pattern | Reference File |
|---------|---------------|
| Config form structure | `AIImageConfigForm.tsx` |
| Config change handler | `CreateTabForm.tsx` (handleAIImageConfigChange) |
| Task selector | `ai-image-config/TaskSelector.tsx` |
| Ref media upload | `useRefMediaUpload.ts` |
| Outcome operations | `outcome-operations.ts` |
| Validation | `useOutcomeValidation.ts` |
| PromptComposer usage | `AIImageConfigForm.tsx` lines 175-191 |
