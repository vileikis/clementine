# Quickstart: Gemini 3.1 Flash Image Model Support

**Feature**: 085-gemini-3-1-model
**Date**: 2026-02-28

## Overview

Add `gemini-3.1-flash-image-preview` as a selectable AI image generation model. Three files need changes, totalling ~5 lines of code.

## Changes Required

### 1. Shared Schema — Add enum value

**File**: `packages/shared/src/schemas/experience/experience-config.schema.ts`

Add `'gemini-3.1-flash-image-preview'` to the `aiImageModelSchema` Zod enum array.

### 2. Frontend — Add model option

**File**: `apps/clementine-app/src/domains/experience/create/lib/model-options.ts`

Add `{ value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash' }` to the `AI_IMAGE_MODELS` array.

### 3. Backend — Route to global region

**File**: `functions/src/services/transform/operations/aiGenerateImage.ts`

Update `getLocationForModel()` to return `'global'` for `'gemini-3.1-flash-image-preview'` (same condition as `gemini-3-pro-image-preview`).

## Verification

1. **Build shared package**: `pnpm --filter @clementine/shared build`
2. **Build functions**: `pnpm functions:build`
3. **Type-check app**: `pnpm app:type-check`
4. **Lint & format**: `pnpm app:check`
5. **Manual test**: Create an experience, select "Gemini 3.1 Flash" from dropdown, save, reload, verify selection persists.
