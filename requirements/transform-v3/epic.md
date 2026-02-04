# EPIC: Outcome-based Create (Transform v3)

## Goal

Replace user-authored `transformNodes` with a **Create tab** where admins pick an **Outcome** and fill a small set of parameters. Guest runtime and Cloud Functions operate on **responses** only. `transformNodes` become deprecated (kept only for backward compatibility, ignored by runtime).

## Non-goals

- No advanced mode
- No template DSL in Firestore for MVP
- No migration of existing prelaunch data
- No fallback logic for old sessions (abandon them)
- No text generation stage (future - see [future-patterns.md](./future-patterns.md))
- No video/gif implementation (schema stubs only)

---

## PRD Overview

| PRD | Name | Description |
|-----|------|-------------|
| [1A](./prd-1a-schemas.md) | Schema Foundations | New Zod schemas in shared package |
| [1B](./prd-1b-experience-create.md) | Experience Create Config | Add `create` to experience, publish validation |
| [1C](./prd-1c-session-responses.md) | Session Responses | Unified responses, guest runtime writes |
| [2](./prd-2-admin-create-ux.md) | Admin Create Tab UX | Create tab UI with prompt editor |
| [3](./prd-3-job-cloud-functions.md) | Job + Cloud Functions | Job snapshot, dispatcher, image outcome |
| [4](./prd-4-cleanup.md) | Cleanup & Guardrails | Remove dead code, safety checks |

---

## Dependency Graph

```
┌─────────────────┐
│   PRD 1A        │
│   Schemas       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ PRD   │ │ PRD   │  ◄── Can be developed in PARALLEL
│ 1B    │ │ 1C    │
│ Exp.  │ │ Sess. │
└───┬───┘ └───┬───┘
    │         │
    ▼         │
┌───────┐     │
│ PRD 2 │     │
│ Admin │     │
│ UX    │     │
└───┬───┘     │
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│   PRD 3         │
│   Job + CF      │  ◄── Integration point
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PRD 4         │
│   Cleanup       │
└─────────────────┘
```

### Parallelization Summary

| After completing | You can start in parallel |
|------------------|---------------------------|
| PRD 1A (Schemas) | PRD 1B + PRD 1C |
| PRD 1B (Experience) | PRD 2 (Admin UX) |
| PRD 1B + 1C | PRD 3 (Job + CF) |
| PRD 3 | PRD 4 (Cleanup) |

---

## Create Outcome Schema

### Final Structure

```ts
create: {
  // Outcome type
  type: 'image' | 'gif' | 'video' | null,

  // Shared (top-level)
  captureStepId: string | null,     // Capture step for source media
  aiEnabled: boolean,               // Global toggle for AI generation

  // Image generation config (preserved when switching outcomes)
  imageGeneration: {
    prompt: string,
    refMedia: MediaReference[],
    model: AIImageModel,
    aspectRatio: AIImageAspectRatio,
  },

  // Type-specific options (discriminated union)
  options: ImageOptions | GifOptions | VideoOptions | null,
}
```

### Field Placement Rationale

| Field | Location | Rationale |
|-------|----------|-----------|
| `captureStepId` | Top level | Same source media regardless of output format |
| `aiEnabled` | Top level | Global toggle for all AI stages (future: text, video) |
| `imageGeneration` | Named block | Preserved when switching outcomes; clear naming for future stages |
| `options` | Discriminated union | Type-specific settings; can reset on switch without losing shared config |

### Passthrough Mode

| `aiEnabled` | `captureStepId` | Behavior |
|-------------|-----------------|----------|
| `true` | `null` | Prompt-only generation |
| `true` | set | Image-to-image transformation |
| `false` | set | Passthrough (apply overlay only) |
| `false` | `null` | **Invalid** - validation error |

### Multiple Capture Steps

For experiences with multiple capture steps (e.g., "user photo" + "friend photo"):
- `captureStepId` specifies the **primary** source for image-to-image transformation
- Additional captures can be referenced via `@{step:capture_name}` in the prompt
- This provides flexibility without complicating the schema

### Switching Outcomes

When user switches between image/gif/video:
- `imageGeneration` block **preserved** (prompt, refMedia, model, aspectRatio)
- `options` block **reset to defaults** for new outcome type

---

## Schema Changes Summary

| Schema | PRD | Change |
|--------|-----|--------|
| `mediaDisplayNameSchema` | 1A | NEW - validation for mention-safe names |
| `createOutcomeSchema` | 1A | NEW - outcome config with `captureStepId` and imageGeneration |
| `sessionResponseSchema` | 1A | NEW - unified response with `stepName`, `context` for all rich data |
| `experienceConfigSchema` | 1B | Add `create` field |
| `sessionSchema` | 1C | Add `responses[]`, deprecate `answers[]` + `capturedMedia[]` |
| `jobSnapshotSchema` | 3 | Add `createOutcome`, update `sessionInputs` |

---

## Session Response Schema

```ts
sessionResponse: {
  stepId: string,
  stepName: string,           // For @{step:...} resolution (input AND capture)
  stepType: string,           // No separate kind enum
  value: string | string[] | null,
  context: unknown | null,    // Rich structured data (see table below)
  createdAt: number,
  updatedAt: number,
}
```

### Context Shape by Step Type

The `context` field holds rich structured data, with interpretation based on `stepType`:

| Step Type | `value` | `context` |
|-----------|---------|-----------|
| `input.shortText` | `"user text"` | `null` |
| `input.longText` | `"user text"` | `null` |
| `input.scale` | `"1"` to `"5"` | `null` |
| `input.yesNo` | `"yes"` or `"no"` | `null` |
| `input.multiSelect` | `["opt1", "opt2"]` | `MultiSelectOption[]` |
| `capture.photo` | `null` | `MediaReference[]` (1 item) |
| `capture.gif` | `null` | `MediaReference[]` (4 items) |
| `capture.video` | `null` | `MediaReference[]` (1 item) |

**Key design decisions:**
- **No separate `media` field** - capture media stored in `context` as `MediaReference[]`
- **Captures always use array** - even single photo/video uses `[MediaReference]` for consistency
- **`value` is null for captures** - no analytical use case for asset IDs
- **`@{step:...}` works for all steps** - inputs resolve to value/context, captures resolve to media in context

---

## Key Decisions (Locked)

### Schema Design
1. **No `responseKindSchema`** - use `stepType` directly
2. **`captureStepId` at top level** - shared across all outcome types (renamed from `sourceStepId`)
3. **`aiEnabled` at top level** - global toggle for all AI stages
4. **`imageGeneration` not `ai`** - clear naming for future stages
5. **`options` as discriminated union** - type-specific, can reset on switch

### Data Handling
6. **No separate `media` field in responses** - capture media stored in `context` as `MediaReference[]`
7. **`stepName` in responses** - for direct `@{step:...}` prompt resolution (both input AND capture steps)
8. **Captures always use `MediaReference[]`** - even single photo/video uses array for consistency
9. **`value` is null for captures** - no analytical use case for asset IDs as primitive values
10. **Abandon old sessions** - no migration, no fallback logic
11. **`transformNodes` always `[]`** - kept in schema but ignored
12. **Deprecate `answers[]` and `capturedMedia[]`** - keep for backward compatibility, cleanup in PRD 4

### Overlays
13. **Per aspect ratio** - `projectContext.overlays[aspectRatio]`
14. **No experience toggle** - project owns overlay config

---

## MVP Scope

| Feature | Status |
|---------|--------|
| Image outcome | **Implemented** |
| Passthrough mode (`aiEnabled: false`) | **Implemented** |
| GIF outcome | Schema stub, "coming soon" in UI |
| Video outcome | Schema stub, "coming soon" in UI |
| Text generation stage | Future (see [future-patterns.md](./future-patterns.md)) |

---

## Success Criteria

- [ ] Admin can configure Create outcome (image) without seeing nodes
- [ ] Admin can toggle AI on/off (passthrough mode)
- [ ] Switching outcomes preserves imageGeneration config
- [ ] Guest flow writes unified `responses[]` with `stepName`
- [ ] Cloud Functions execute from `job.snapshot.createOutcome`
- [ ] Prompt mentions (`@{step:...}`, `@{ref:...}`) resolve correctly
- [ ] Old `transformNodes` code paths are removed

---

## Related Documents

- [Future Patterns](./future-patterns.md) - Linear chain generation, text stage, video stage
- [055-lexical-prompt-editor spec](../../specs/055-lexical-prompt-editor/spec.md) - Prompt editor implementation
- [Session schema](../../packages/shared/src/schemas/session/session.schema.ts)
- [Experience schema](../../packages/shared/src/schemas/experience/experience.schema.ts)
