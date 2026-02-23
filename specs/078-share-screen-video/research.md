# Research: Share Screen Video Support

**Feature**: 078-share-screen-video
**Date**: 2026-02-23

## Research Question 1: How to determine media type on the share screen?

### Context

The share screen renders `session.resultMedia` (a `MediaReference` with `url`, `filePath`, `displayName`, `mediaAssetId`). The media format (`image` | `gif` | `video`) is only stored on `job.output.format`, which lives in a separate Firestore document at `projects/{projectId}/jobs/{jobId}`.

### Problem

Firestore security rules restrict job document reads to admins only:
```
match /jobs/{jobId} {
  allow read: if isAdmin();
}
```

Guest users on the share screen cannot query the job document.

### Options Evaluated

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A | Add `resultMediaFormat` to session document | Clean, type-safe, zero extra reads, uses existing session subscription | Requires backend change + schema update |
| B | Query job document from client | Uses canonical data | Blocked by Firestore rules; would require rule change exposing job internals to guests |
| C | Infer format from URL file extension | Zero backend changes | Fragile; Firebase Storage URLs may not have extension; breaks if CDN rewrites URLs |
| D | Extend MediaReference with `format` field | Centralized type | Pollutes generic type used for themes, overlays, etc. where format is irrelevant |

### Decision: Option A — Add `resultMediaFormat` and `resultMediaThumbnailUrl` to session

**Rationale**:
- Session is already subscribed to in real-time on the share screen via `useSubscribeSession`
- The backend already has `output.format` and `output.thumbnailUrl` available when writing `resultMedia` to the session (in `transformPipelineTask.ts` line 198)
- Adding two fields to the session write is a minimal backend change (2 lines)
- The session schema uses `z.looseObject()`, so extra fields are preserved even before schema is updated
- No extra Firestore reads, no security rule changes, no generic type pollution

**Alternatives rejected**:
- Option B rejected because it would require changing Firestore rules and expose job execution details to guests
- Option C rejected because URL parsing is unreliable and would break on CDN-rewritten URLs
- Option D rejected because MediaReference is used in 10+ contexts where format is meaningless

---

## Research Question 2: HTML5 video autoplay behavior across browsers

### Context

The spec requires autoplay ON, sound OFF by default. Browser autoplay policies affect this.

### Findings

- **All modern browsers** allow autoplay with `muted` attribute: `<video autoplay muted>`
- **iOS Safari**: Requires `playsinline` attribute to prevent fullscreen takeover
- **Chrome/Firefox/Edge**: Autoplay works reliably when `muted`
- **Chrome (Android)**: Autoplay works with `muted` + `playsinline`

### Decision

Use `<video autoplay muted loop playsinline>` for maximum compatibility. This satisfies the PRD requirements (autoplay ON, sound OFF) and works across all target browsers.

---

## Research Question 3: Hiding native video controls selectively

### Context

The spec requires play/pause only — no scrub bar, no volume, no download button.

### Options Evaluated

| Option | Description | Pros | Cons |
| ------ | ----------- | ---- | ---- |
| A | Custom overlay controls, no native `controls` attribute | Full control over UI | Must build play/pause button and toggle logic |
| B | Native `controls` with CSS to hide unwanted elements | Less code | Browser-specific, fragile, can't reliably hide individual controls |

### Decision: Option A — Custom play/pause overlay

**Rationale**:
- Native browser controls cannot be selectively hidden reliably across browsers
- Custom overlay is simple: one toggle button positioned over the video
- Click/tap on video area toggles play/pause
- A single centered play/pause icon provides clear affordance
- Total code: ~30 lines for the overlay component

---

## Research Question 4: Video download MIME type for Web Share API

### Context

The Web Share API (`navigator.share()`) requires correct MIME type in the `File` constructor for video sharing on mobile.

### Findings

- Video files from the AI pipeline are MP4 (H.264)
- `new File([blob], filename, { type: 'video/mp4' })` is required for mobile share sheet
- Current implementation hardcodes `type: 'image/jpeg'` (in `useShareActions.ts`)
- The MIME type can be derived from format: `image` → `image/jpeg`, `video` → `video/mp4`, `gif` → `image/gif`

### Decision

Map `resultMediaFormat` to MIME type and file extension in `useShareActions`:
- `image` → `.jpg`, `image/jpeg`
- `gif` → `.gif`, `image/gif`
- `video` → `.mp4`, `video/mp4`

---

## Research Question 5: Layout strategy for mixed aspect ratios in ~50vh container

### Context

Videos can be 1:1, 9:16, or 16:9. The media container must cap at ~50vh and keep the CTA visible.

### Decision

Use `max-h-[50vh]` with `object-contain` on the video/image element. This naturally handles all aspect ratios:
- 9:16 (portrait): Tall and narrow, letterboxed horizontally
- 16:9 (landscape): Wide and short, uses full width
- 1:1 (square): Centered with equal padding

The container itself is `flex items-center justify-center` with the max height constraint. The CTA section sits below with guaranteed visibility since the media never exceeds 50vh.
