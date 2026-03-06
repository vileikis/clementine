# Quickstart: LLM Models Cleanup & UI Adjustments

**Feature**: 090-llm-models-cleanup
**Date**: 2026-03-06

## Overview

This cleanup removes the deprecated `gemini-3-pro-image-preview` model and hides the "Enhance Prompt" UI control. No new features are added.

## Changes by workspace

### 1. packages/shared (schema)

**File**: `src/schemas/experience/experience-config.schema.ts`
- Remove `'gemini-3-pro-image-preview'` from the `aiImageModelSchema` Zod enum
- Rebuild: `pnpm --filter @clementine/shared build`

### 2. functions (backend)

**File**: `src/services/ai/config.ts`
- Update `MOCKED_AI_CONFIG` to use a valid model (e.g., `gemini-2.5-flash-image`)

**File**: `src/services/transform/operations/aiGenerateImage.ts`
- Remove `gemini-3-pro-image-preview` from `getLocationForModel()` and associated comment

**File**: `src/services/ai/providers/types.ts`
- Remove or update comment referencing the deprecated model

### 3. apps/clementine-app (frontend)

**File**: `src/domains/experience/create/lib/model-options.ts`
- Remove the `{ value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' }` entry from `AI_IMAGE_MODELS`

**File**: `src/domains/experience/create/components/PromptComposer/ControlRow.tsx`
- Add `const ENABLE_ENHANCE_PROMPT = false` constant
- Wrap enhance control render block with `{ENABLE_ENHANCE_PROMPT && (...)}`

## Validation

```bash
# Build shared package first (schema change propagates)
pnpm --filter @clementine/shared build

# Type-check all workspaces
pnpm app:type-check
pnpm functions:build

# Lint and format
pnpm app:check

# Verify no remaining references
grep -r "gemini-3-pro-image-preview" apps/ functions/ packages/shared/src/
# Expected: no results

# Visual check
pnpm app:dev
# Open experience create form → verify model dropdown has no "Gemini 3 Pro"
# Open video experience → verify no "Enhance" toggle visible
```
