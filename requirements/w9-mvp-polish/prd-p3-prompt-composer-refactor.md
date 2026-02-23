# PRD P3 — PromptComposer Refactor

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P3 — Architecture & Tech Debt
> **Area**: App (Frontend)

---

## Why This Matters Strategically

We're becoming: Text -> Image -> Video -> Multi-step generation.

Current architecture (20 props + 12 props child) is NOT modality scalable. If we don't refactor now, adding audio, motion style, and brand layers becomes a nightmare.

---

## Objective

Move from prop explosion to modular modality-based configuration.

---

## Current Problem

```
<PromptComposer
  prop1
  prop2
  ...
  prop20
/>
```

## Proposed Architecture

```
<PromptComposer>
  <ModalityConfig type="video" />
  <PromptControls />
  <ReferenceImages />
  <AdvancedSettings />
</PromptComposer>
```

---

## Core Concepts

Create a `ModalityDefinition`:

```ts
ModalityDefinition {
  type: 'text' | 'image' | 'video'
  supportsNegativePrompt: boolean
  supportsReferenceImages: boolean
  supportsSound: boolean
  supportsEnhance: boolean
  limits: {
    maxRefImages: number
    maxPromptLength: number
  }
}
```

Controls auto-render based on modality definition.

---

## Success Metrics

- Adding new modality requires < 10% new UI code
- Remove 50% of prop drilling
