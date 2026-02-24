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

## Tier 4 -- UX Polish

Improves creator experience and reduces confusion.

---

# PRIORITY ORDER (Brutally Honest)

## ~~P1 -- Share Screen + Video Handling (App)~~ ✅ COMPLETED

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

## ~~P2 -- Cloud: Dropbox + Email Video Handling~~ ✅ COMPLETED

**Tier**: Revenue Blocking
**PRD**: [prd-p2-dropbox-email-video.md](./prd-p2-dropbox-email-video.md)

Because once users create video, the backend must not choke. This is operational trust. If export fails, agencies stop trusting you.

---

## ~~P3 -- PromptComposer Refactor~~ ✅ COMPLETED

**Tier**: Architecture & Tech Debt
**PRD**: [prd-p3-prompt-composer-refactor.md](./prd-p3-prompt-composer-refactor.md)

20 props + 12 props child = architecture collapse waiting to happen. This is tech debt, not feature. But if you plan video modality growth, you must fix it.

**Strategic context:** We're becoming Text -> Image -> Video -> Multi-step generation. Current architecture is NOT modality scalable. If we don't refactor now, adding audio, motion style, brand layers becomes a nightmare.

---

## P4 -- Experience Type Flattening

**Tier**: Architecture / Foundation
**PRD**: [prd-p4-experience-type-flattening.md](./prd-p4-experience-type-flattening.md)

Unify `experience.profile` and `outcome.type` into a single `experience.type`. The experience's real identity — what kind of output it produces — should be a first-class, top-level concept selected at creation time, not buried inside a nested config object.

**Why P4:** Every feature from here on (type-specific controls, type filtering in library, type badges, analytics) needs to know "what kind of experience is this?" at the top level. Building on the current profile + outcome.type split means every future feature inherits the indirection. Fix the foundation before expanding.

---

## P5 -- Create Tab UX: Aspect Ratio Clarity

**Tier**: UX Polish
**PRD**: [prd-p5-create-tab-ar-clarity.md](./prd-p5-create-tab-ar-clarity.md)

The Create tab's aspect ratio picker is ambiguous — users can't tell if it controls input (capture) or output (generation) shape. Simplify to a two-level model: capture AR + single output AR. Remove redundant generation-level AR overrides.

**Why P5:** Depends on P4 (flattened outcome). Once the Create tab is restructured, the AR sections should be clearly labeled and logically grouped.

---

## P6 -- Video AI Controls (Enhance / Sound / Negative Prompt / Quality)

**Tier**: Growth / Differentiation
**PRD**: [prd-p6-video-advanced-controls.md](./prd-p6-video-advanced-controls.md)

This is feature expansion. It improves differentiation. But only after stability and correct foundation (P4).

---

## P7 -- Overlay for AI Video Outcome (Cloud)

**Tier**: Growth / Differentiation (unless pilot requires it)
**PRD**: [prd-p7-video-overlay-engine.md](./prd-p7-video-overlay-engine.md)

Only high priority if overlay is a brand requirement for pilots. Otherwise secondary.

Could become a major differentiator -- dynamically overlay brand logo, campaign hashtag, frame design to increase shareability.

---

## P8 -- MediaReference Schema Enrichment

**Tier**: Architecture & Tech Debt
**PRD**: [prd-p8-media-reference-enrichment.md](./prd-p8-media-reference-enrichment.md)

`MediaReference` is a dumb pointer — knows where media lives but not what kind. AI pipelines hardcode `'image/jpeg'`, format metadata is scattered across parent documents, and dimensions are lost between `MediaAsset` and its reference. Add `format`, `mimeType`, and `width`/`height` to make every media pointer self-describing.

**Now also includes:** Fix AI image pipeline to read real output dimensions instead of hardcoded guesses, and pass them through to `uploadOutput()`.

**Strategic context:** Every new media modality (video, GIF, audio) will hit this same wall. Fix it once in the shared schema rather than adding format side-channels to every parent document.

---

# Final Priority Stack

| # | Feature | PRD | Tier |
|---|---------|-----|------|
| ~~1~~ | ~~Share screen video handling~~ | ~~[P1](./prd-p1-share-screen-video.md)~~ | ✅ Done |
| ~~2~~ | ~~Dropbox + Email video support~~ | ~~[P2](./prd-p2-dropbox-email-video.md)~~ | ✅ Done |
| ~~3~~ | ~~PromptComposer refactor~~ | ~~[P3](./prd-p3-prompt-composer-refactor.md)~~ | ✅ Done |
| 4 | Experience type flattening | [P4](./prd-p4-experience-type-flattening.md) | Foundation |
| 5 | Create tab AR clarity | [P5](./prd-p5-create-tab-ar-clarity.md) | UX Polish |
| 6 | Video advanced controls | [P6](./prd-p6-video-advanced-controls.md) | Differentiation |
| 7 | Video overlay engine | [P7](./prd-p7-video-overlay-engine.md) | Differentiation |
| 8 | MediaReference enrichment + real dimensions | [P8](./prd-p8-media-reference-enrichment.md) | Tech Debt |

---

# Strategic Warning

You are drifting toward feature expansion.

Your real north star is:

> Can a brand run an event with 1,000 guests and everything works flawlessly?

Everything should be evaluated against that.
