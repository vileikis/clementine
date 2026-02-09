## Camera Adaptive Width (Camera Active + Photo Review)

### Goal

Make camera capture UI look intentional on any device + aspect ratio, while keeping controls always accessible.

You already have lifecycle working — this is **layout + fit** done right.

---

### Shared layout rule (both states)

- Screen is two vertical zones:
  1. **Preview Zone** (flex: 1)
  2. **Controls Zone** (fixed height, pinned to bottom, safe-area aware)

Controls must never overlap the preview unexpectedly.

**Controls Zone**

- Always visible
- Safe-area bottom padding (iOS)
- Consistent height across Camera Active and Photo Review

---

## 3A) Camera Active

### Visual structure

- Preview Zone contains a **Camera Container**:
  - full width
  - takes remaining height
  - rounded corners
  - black background
  - internal padding optional (but be consistent)

Inside Camera Container is the **Camera View** fitted to the target aspect ratio.

### Aspect ratio fitting rule

Target aspect ratios: `1:1, 2:3, 3:2, 9:16`.

The camera view should:

- **Fit inside** the container while preserving aspect ratio (**contain** behavior)
- Centered
- Any extra space becomes black straps (left/right or top/bottom depending on mismatch)

This is the simplest and most predictable UX.

### Controls

Bottom controls include:

- open library
- shutter
- flip camera

Controls should not jump between orientations; keep the same bar.

### Interaction requirements

- If permission denied:
  - Show a friendly state in the Camera Container with CTA to open settings.

- While camera initializing:
  - Show skeleton/loader inside container (still black background + rounded)

### Acceptance criteria

- On tall screens with 1:1 ratio → black straps top/bottom.
- On wide screens with 9:16 ratio → black straps left/right.
- Controls remain pinned and usable in all cases.

---

## 3B) Photo Review

### Visual structure

- Preview Zone shows captured media (image/video) fitted similarly:
  - **no camera container styling**
  - media preview takes all available space
  - but still uses aspect-ratio-preserving contain (so it doesn’t crop unexpectedly)

- Controls Zone:
  - **Retake**
  - **Submit**

### Review-specific rules

- If captured media aspect ratio differs from target ratio:
  - still render as-is (don’t distort)
  - optionally show subtle hint “Output will be cropped to X” _only if that’s true downstream_ (don’t lie)

### Acceptance criteria

- Review looks cleaner than capture state (no black rounded box).
- Controls stay fixed.
- Media never stretches.

---

## The traps you should defend against (now, not later)

1. **Controls overlap the preview** on small screens (fix with strict two-zone layout + safe-area padding).
2. **Aspect ratio math bugs** when rotating device (make ratio derived from current experience config; recompute layout on resize/orientation change).
3. **Inconsistent fit between capture vs review** (users hate when framing changes). If output uses contain, keep both contain.
4. **Preview looks “floating”** — if you remove container on review, you need consistent padding/margins so it still feels aligned.
