# PRD P1 — Share Screen + Video Support

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P1 — Revenue Blocking
> **Area**: App (Frontend)

---

## Objective

Support image + video results seamlessly in share view across desktop and mobile.

## Why This is #1

This is literally what the end user sees. If videos are part of our core offer and they don't display properly, break layout, don't download correctly, or don't share well on mobile — we're dead on arrival. No brand case study without a polished share experience.

## Users

- **Guest** (primary) — viewing and sharing their AI-generated result
- **Brand client** (secondary) — reviewing results

---

## Requirements

### 1. Media Rendering

- Detect media type (image / video)
- If video:
  - Autoplay ON by default
  - Sound OFF by default
  - Controls: Play / Pause only
  - No scrub bar
  - No download inside player
- Aspect ratio preserved

### 2. Layout Constraint

- Result media container max height: ~50vh
- Centered
- Should support:
  - 1:1
  - 9:16
  - 16:9
- Prevent pushing CTA below the fold

### 3. Download

- **Desktop**: Direct file download
- **Mobile**:
  - Native share sheet if supported
  - Fallback: download

### 4. Performance

- Lazy load video
- Show thumbnail first
- Loading spinner

---

## Success Metrics

- > 98% successful video play rate
- < 2% failed download rate
