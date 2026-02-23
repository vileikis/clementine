# Architecture Memo: Compound Components vs Context Pattern

**Date**: 2026-02-23
**Feature**: 080-prompt-composer-refactor

## PRD Proposal

The original PRD (`requirements/w9-mvp-polish/prd-p3-prompt-composer-refactor.md`) proposed a compound component pattern:

```tsx
<PromptComposer>
  <ModalityConfig type="video" />
  <PromptControls />
  <ReferenceImages />
  <AdvancedSettings />
</PromptComposer>
```

## What We Built Instead

Context-based modality distribution with a props interface:

```tsx
<PromptComposer
  modality={VIDEO_MODALITY}
  prompt={...}
  onPromptChange={...}
  model={...}
  onModelChange={...}
  controls={{ duration, onDurationChange }}
  refMedia={{ items, onRemove, uploadingFiles, ... }}
  steps={mentionableSteps}
/>
```

Child components (ControlRow, ReferenceMediaStrip, AddMediaButton) read from `PromptComposerContext` internally — zero props.

## Why We Diverged

1. **Rendering model mismatch**: Every PromptComposer renders the same internal components (prompt input, control row, media strip). What varies is which controls appear *within* those fixed components, not which components exist. Children-as-slots gives consumers a knob they'd never turn.

2. **Props don't actually reduce**: Compound components move props from one element to many child elements. You still need context to avoid drilling into children — so you'd have context *plus* compound pattern, adding complexity without reducing it.

3. **Migration cost**: 3 consumers would need significantly larger JSX changes. The context approach was a smaller diff with the same outcome.

4. **Core concept preserved**: The `ModalityDefinition` object — the PRD's key insight — drives auto-rendering. It's a prop rather than a JSX child element. Same declarative intent, simpler surface.

## When to Revisit

The compound pattern becomes valuable if:

- Consumers need to **customize which sub-components appear** (e.g., some consumers want `<AdvancedSettings>`, others don't)
- Consumers need to **inject custom components** into the PromptComposer layout
- A new modality requires **fundamentally different internal structure** (not just toggling controls)
- The `<AdvancedSettings>` concept from the PRD materializes as a real requirement

The context infrastructure is already in place, so evolving toward compound components later would be additive, not a rewrite.

## References

- PRD: `requirements/w9-mvp-polish/prd-p3-prompt-composer-refactor.md`
- Research decision: `specs/080-prompt-composer-refactor/research.md` §R-003
- Plan decision: `specs/080-prompt-composer-refactor/plan.md` §D-003
