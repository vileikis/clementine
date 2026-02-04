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
  sourceStepId: string | null,      // Capture step for source media
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
| `sourceStepId` | Top level | Same source media regardless of output format |
| `aiEnabled` | Top level | Global toggle for all AI stages (future: text, video) |
| `imageGeneration` | Named block | Preserved when switching outcomes; clear naming for future stages |
| `options` | Discriminated union | Type-specific settings; can reset on switch without losing shared config |

### Passthrough Mode

| `aiEnabled` | `sourceStepId` | Behavior |
|-------------|----------------|----------|
| `true` | `null` | Prompt-only generation |
| `true` | set | Image-to-image transformation |
| `false` | set | Passthrough (apply overlay only) |
| `false` | `null` | **Invalid** - validation error |

### Switching Outcomes

When user switches between image/gif/video:
- `imageGeneration` block **preserved** (prompt, refMedia, model, aspectRatio)
- `options` block **reset to defaults** for new outcome type

---

## Schema Changes Summary

| Schema | PRD | Change |
|--------|-----|--------|
| `mediaDisplayNameSchema` | 1A | NEW - validation for mention-safe names |
| `createOutcomeSchema` | 1A | NEW - outcome config with imageGeneration |
| `sessionResponseSchema` | 1A | NEW - unified response with `stepName` |
| `experienceConfigSchema` | 1B | Add `create` field |
| `sessionSchema` | 1C | Add `responses[]`, deprecate `answers[]` + `capturedMedia[]` |
| `jobSnapshotSchema` | 3 | Add `createOutcome`, update `sessionInputs` |

---

## Session Response Schema

```ts
sessionResponse: {
  stepId: string,
  stepName: string,           // For @{step:...} resolution
  stepType: string,           // No separate kind enum
  value: string | string[] | null,
  context: unknown | null,
  media: MediaReference | null,  // Full reference with filePath
  createdAt: number,
  updatedAt: number,
}
```

---

## Key Decisions (Locked)

### Schema Design
1. **No `responseKindSchema`** - use `stepType` directly
2. **`sourceStepId` at top level** - shared across all outcome types
3. **`aiEnabled` at top level** - global toggle for all AI stages
4. **`imageGeneration` not `ai`** - clear naming for future stages
5. **`options` as discriminated union** - type-specific, can reset on switch

### Data Handling
6. **MediaReference for capture media** - includes `filePath` for CF processing
7. **`stepName` in responses** - for direct `@{step:...}` prompt resolution
8. **Abandon old sessions** - no migration, no fallback logic
9. **`transformNodes` always `[]`** - kept in schema but ignored

### Overlays
10. **Per aspect ratio** - `projectContext.overlays[aspectRatio]`
11. **No experience toggle** - project owns overlay config

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
