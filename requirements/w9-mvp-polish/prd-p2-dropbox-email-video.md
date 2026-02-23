# PRD P2 — Dropbox + Email Video Handling

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P2 — Revenue Blocking
> **Area**: Cloud (Backend)

---

## Why This Matters

Once users create video, the backend must not choke. This is operational trust. If export fails, agencies stop trusting you.

---

## Part A: Dropbox Video Export

### Objective

Upload large AI-generated videos to client Dropbox reliably.

### Requirements

- Use Dropbox Upload Session (chunked upload)
- Retry on failure (3 attempts)
- File naming: `eventName_userId_timestamp.mp4`
- Progress tracking in logs
- Handle files up to 500MB

### Edge Cases

- Dropbox rate limit
- Partial upload
- Expired token

### Success Metrics

- > 99% successful upload rate
- No corrupted files

---

## Part B: Email Handling for Video

### Problem

Embedding video in email is unreliable. So don't.

### Correct Approach

- Generate video thumbnail
- Link to hosted result page

### Requirements

- If `mediaType === video`:
  - Attach thumbnail
  - CTA: "Watch Your Video"
  - Link to result page
- If image:
  - Embed directly

### Success Metrics

- Email open -> click rate > 20%
