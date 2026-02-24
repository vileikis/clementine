# PRD P7 — Video Overlay Engine

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P7 — Growth / Differentiation (unless pilot requires it)
> **Area**: Cloud (Backend)

---

## Why This Could Be a Major Differentiator

If we can dynamically overlay brand logo, campaign hashtag, and frame design on AI video output — we increase shareability significantly.

Only high priority if overlay is a brand requirement for pilots. Otherwise secondary.

---

## Objective

Apply branded overlay to AI video output automatically.

---

## Approach

- FFmpeg-based compositing
- Support:
  - Transparent PNG overlays
  - Positioning (top-right, bottom-center, full-frame)
  - Opacity control

---

## Must Support

- 9:16 and 1:1 without distortion

---

## Success Metrics

- Overlay processing < 10 sec
- Zero audio corruption
