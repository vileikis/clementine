# What Actually Matters for Clementine Right Now?

You are building a **Digital AI Photobooth for events**.

In a live event:

- If video doesn't render -> you look amateur.
- If share doesn't work -> viral loop dies.
- If export fails -> brand ops get angry.
- If prompt architecture is messy -> you slow down future feature velocity.

So we separate:

## Tier 1 -- Revenue Blocking

Must be done before pilots scale.

## Tier 2 -- Growth / Differentiation

Improves perceived value.

## Tier 3 -- Architecture & Tech Debt

Important but not immediately revenue critical.

---

# PRIORITY ORDER (Brutally Honest)

## P1 -- Share Screen + Video Handling (App)

**Tier**: Revenue Blocking
**PRD**: [prd-p1-share-screen-video.md](./prd-p1-share-screen-video.md)

If videos are part of your core offer, and:

- They don't display properly
- They break layout
- They don't download correctly
- They don't share well on mobile

You're dead on arrival.

**Why this is #1:** This is literally what the end user sees. If this feels broken, no brand case study.

---

## P2 -- Cloud: Dropbox + Email Video Handling

**Tier**: Revenue Blocking
**PRD**: [prd-p2-dropbox-email-video.md](./prd-p2-dropbox-email-video.md)

Because once users create video, the backend must not choke. This is operational trust. If export fails, agencies stop trusting you.

---

## P3 -- PromptComposer Refactor

**Tier**: Architecture & Tech Debt
**PRD**: [prd-p3-prompt-composer-refactor.md](./prd-p3-prompt-composer-refactor.md)

20 props + 12 props child = architecture collapse waiting to happen. This is tech debt, not feature. But if you plan video modality growth, you must fix it.

**Strategic context:** We're becoming Text -> Image -> Video -> Multi-step generation. Current architecture is NOT modality scalable. If we don't refactor now, adding audio, motion style, brand layers becomes a nightmare.

---

## P4 -- Video AI Controls (Enhance / Sound / Negative Prompt / Quality)

**Tier**: Growth / Differentiation
**PRD**: [prd-p4-video-advanced-controls.md](./prd-p4-video-advanced-controls.md)

This is feature expansion. It improves differentiation. But only after stability.

---

## P5 -- Overlay for AI Video Outcome (Cloud)

**Tier**: Growth / Differentiation (unless pilot requires it)
**PRD**: [prd-p5-video-overlay-engine.md](./prd-p5-video-overlay-engine.md)

Only high priority if overlay is a brand requirement for pilots. Otherwise secondary.

Could become a major differentiator -- dynamically overlay brand logo, campaign hashtag, frame design to increase shareability.

---

# Final Priority Stack

| # | Feature | PRD | Tier |
|---|---------|-----|------|
| 1 | Share screen video handling | [P1](./prd-p1-share-screen-video.md) | Revenue Blocking |
| 2 | Dropbox + Email video support | [P2](./prd-p2-dropbox-email-video.md) | Revenue Blocking |
| 3 | PromptComposer refactor | [P3](./prd-p3-prompt-composer-refactor.md) | Tech Debt |
| 4 | Video advanced controls | [P4](./prd-p4-video-advanced-controls.md) | Differentiation |
| 5 | Video overlay engine | [P5](./prd-p5-video-overlay-engine.md) | Differentiation |

---

# Strategic Warning

You are drifting toward feature expansion.

Your real north star is:

> Can a brand run an event with 1,000 guests and everything works flawlessly?

Everything should be evaluated against that.
