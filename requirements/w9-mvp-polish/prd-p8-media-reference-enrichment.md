# PRD P8 — MediaReference Schema Enrichment

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P8 — Architecture & Tech Debt
> **Area**: Shared Schema, Backend (Functions), App (Frontend)

---

## Objective

Enrich `MediaReference` with `format` and `mimeType` fields so every media pointer in the system is self-describing. Eliminate hardcoded MIME types in consumers and remove the need for context-specific format fields on parent documents.

## Why This Matters

Today `MediaReference` is a dumb pointer — it knows *where* media lives but not *what kind* of media it is. This creates three problems:

1. **Hardcoded assumptions** — AI generation pipelines (`aiGenerateImage.ts`, `aiGenerateVideo.ts`) hardcode `'image/jpeg'` for all MediaReference inputs. This works only because inputs happen to always be photos today. It will break silently when inputs become videos or GIFs.
2. **Format metadata scattered across parent documents** — Feature 078 added `resultMediaFormat` and `resultMediaThumbnailUrl` as session-level fields because MediaReference couldn't carry that info. Every future consumer of result media needs to remember to also pass the format alongside the reference.
3. **No dimensions on references** — Consumers that need aspect ratio (layout, resize, overlay positioning) must either re-fetch the full `MediaAsset` document or guess. The `MediaAsset` schema already has `width` and `height` but this data is lost when creating a lightweight reference.

## Users

- **Developer** (primary) — writing features that consume media across the platform
- **Guest** (indirect) — benefits from correct rendering, downloads, and share behavior

---

## Requirements

### 1. Add `format` to MediaReference

- Add `format: z.enum(['image', 'gif', 'video']).nullable().default(null)` to `mediaReferenceSchema`
- Semantics: high-level rendering category (determines `<img>` vs `<video>` in UI)
- `null` = legacy document, consumer should fall back to `'image'` (backward compatible)

### 2. Add `mimeType` to MediaReference

- Add `mimeType: z.string().nullable().default(null)` to `mediaReferenceSchema`
- Semantics: exact MIME type for API calls, file downloads, share sheets (e.g. `'image/jpeg'`, `'video/mp4'`, `'image/gif'`)
- `null` = legacy document, consumer should derive from format or default to `'image/jpeg'`
- Not using `imageMimeTypeSchema` enum because references can now point to video (`'video/mp4'`) — a broader MIME type schema may be warranted

### 3. Consider `width` / `height` on MediaReference

- Add `width: z.number().int().positive().nullable().default(null)` and `height` to `mediaReferenceSchema`
- Useful for: aspect ratio calculations, layout decisions, overlay positioning, responsive image sizing
- Already available on `MediaAsset` — this propagates it to the lightweight reference
- `null` = legacy document or dimensions unknown

### 4. Fix Real Output Dimensions in AI Pipelines

Currently `aiGenerateImage.ts` uses a hardcoded dimension map (`getDimensionsFromAspectRatio`) instead of reading actual pixel dimensions from the generated image. And `aiImageOutcome.ts` doesn't pass dimensions to `uploadOutput()` at all, falling back to the default `1024x1024`.

**Fix:**
- `aiGenerateImage.ts`: Read actual dimensions from the output image buffer (e.g., parse JPEG header or use a lightweight image probe)
- `aiImageOutcome.ts`: Pass `result.dimensions` to `uploadOutput()`
- `aiGenerateVideo.ts`: Already correct (uses `getMediaDimensions` via ffprobe) — no change needed

This ensures `JobOutput.dimensions` reflects reality, which feeds into MediaReference dimensions (req 3 above).

### 5. Update All Write Sites

Every place that constructs a `MediaReference` must populate the new fields:

| Write Site | Context | Expected Values |
|-----------|---------|-----------------|
| `CapturePhotoRunMode.tsx` | Guest photo capture | `format: 'image'`, `mimeType: 'image/jpeg'`, dimensions from capture |
| `ThemeEditorPage.tsx` | Theme background upload | `format: 'image'`, mimeType from upload, dimensions from MediaAsset |
| `WelcomeEditorPage.tsx` | Welcome screen media upload | `format: 'image'`, mimeType from upload, dimensions from MediaAsset |
| `transformPipelineTask.ts` | Job completion result | `format: output.format`, mimeType derived from format, dimensions from output |
| Test helpers (`resolvePromptMentions.test.ts`) | Test fixtures | Explicit format values |
| Any other upload flow constructing MediaReference | Various | Populate from MediaAsset or upload metadata |

### 6. Update All Read Sites / Consumers

| Consumer | Current Behavior | Target Behavior |
|----------|-----------------|-----------------|
| `aiGenerateImage.ts` | Hardcodes `'image/jpeg'` | Read `ref.mimeType ?? 'image/jpeg'` |
| `aiGenerateVideo.ts` | Hardcodes `'image/jpeg'` | Read `ref.mimeType ?? 'image/jpeg'` |
| `useShareActions.ts` | Reads `mediaFormat` param separately | Read `media.format` directly, remove `mediaFormat` param |
| `ShareReadyRenderer.tsx` | Receives `mediaFormat` + `mediaThumbnailUrl` as separate props | Read `mediaUrl` format from reference, simplify props |
| `SharePage.tsx` | Extracts `resultMediaFormat` separately | Can derive from `resultMedia.format` |

### 7. Deprecate Session-Level Format Fields

Once MediaReference carries `format`:
- `session.resultMediaFormat` becomes redundant (available as `session.resultMedia.format`)
- `session.resultMediaThumbnailUrl` stays — thumbnails are a separate concern, not part of the media reference itself
- Migration: keep both fields temporarily, read from `resultMedia.format` with fallback to `resultMediaFormat`

### 8. Backward Compatibility

- All new fields use `.nullable().default(null)` — existing Firestore documents parse without error
- `z.looseObject()` already preserves unknown fields — no migration needed for existing documents
- Consumers must handle `null` gracefully (fall back to current behavior)
- No bulk data migration required — new fields populated on future writes only

---

## Out of Scope

- Changing `MediaAsset` schema (already has all these fields)
- Adding thumbnail as a nested MediaReference (thumbnails are derived, not first-class assets)
- Renaming `imageMimeTypeSchema` to a broader `mediaMimeTypeSchema` (can be a separate cleanup)
- Retroactive backfill of existing documents (would require a migration script for limited value)

---

## Success Metrics

- Zero hardcoded MIME types in backend consumer code
- All new MediaReference writes include `format` and `mimeType`
- `resultMediaFormat` session field deprecated in favor of `resultMedia.format`
- No runtime regressions — all existing image/video rendering continues working
