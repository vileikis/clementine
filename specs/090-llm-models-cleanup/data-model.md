# Data Model: LLM Models Cleanup & UI Adjustments

**Feature**: 090-llm-models-cleanup
**Date**: 2026-03-06

## Entity Changes

This feature modifies one existing entity — no new entities are created.

### ExperienceConfig (modified)

**Schema file**: `packages/shared/src/schemas/experience/experience-config.schema.ts`

#### aiImageModelSchema (Zod enum)

| Field | Before | After |
| ----- | ------ | ----- |
| Enum values | `gemini-2.5-flash-image`, `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview` | `gemini-2.5-flash-image`, `gemini-3.1-flash-image-preview` |

#### Impact on existing data

- Firestore documents with `aiImageModel: "gemini-3-pro-image-preview"` are legacy
- No migration needed — the field value becomes unrecognized but does not block document reads
- When a user edits such an experience, they will need to select a valid model from the updated list

## No New Entities

This is a cleanup task. No new data models, collections, or relationships are introduced.
