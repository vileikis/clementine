# Data Model: Gemini 3.1 Flash Image Model Support

**Feature**: 085-gemini-3-1-model
**Date**: 2026-02-28

## Entity Changes

### AI Image Model (Enum Extension)

**Location**: `packages/shared/src/schemas/experience/experience-config.schema.ts`

The `aiImageModelSchema` Zod enum gains one new value:

| Value (before) | Value (after) |
|----------------|---------------|
| `gemini-2.5-flash-image` | `gemini-2.5-flash-image` |
| `gemini-3-pro-image-preview` | `gemini-3-pro-image-preview` |
| — | `gemini-3.1-flash-image-preview` *(new)* |

**Impact on derived type**: `AIImageModel` (via `z.infer`) will expand to include the new literal string value.

### Experience Configuration (No Schema Change)

The `imageGenerationConfigSchema` already accepts any valid `AIImageModel` via its `model` field. No structural changes needed — the new enum value flows through automatically.

**Default remains**: `'gemini-2.5-flash-image'`

## Region Routing (Backend Logic)

The `getLocationForModel()` function maps models to Vertex AI regions:

| Model | Region |
|-------|--------|
| `gemini-2.5-flash-image` | `VERTEX_AI_LOCATION` env var (default: `us-central1`) |
| `gemini-3-pro-image-preview` | `global` |
| `gemini-3.1-flash-image-preview` | `global` *(new — same as gemini-3-pro)* |

## No New Entities

No new collections, documents, or fields are introduced. The change is purely additive to an existing enum.
