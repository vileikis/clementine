# Transform Pipeline Step - Requirements

## Overview

The Transform Pipeline step is a special step type that processes media (photos, GIFs, videos) through a configurable sequence of transformation nodes. Unlike other steps that collect user input, the transform step executes server-side processing using AI models and image manipulation tools.

## Status

**Current Phase**: Phase 1 Complete, Phase 2 Not Started
**Last Updated**: 2026-01-21

## Documents

### Planning
- [prd-phases.md](./prd-phases.md) - **Implementation phases** (8 phases defined)
- [spec.md](./spec.md) - Detailed technical specification
- [use-cases.md](./use-cases.md) - Detailed use case examples
- [decisions.md](./decisions.md) - Finalized decisions (29 decisions made)
- [open-questions.md](./open-questions.md) - Original questions (now answered)
- [risks.md](./risks.md) - Risk analysis and mitigations
- [discussion.md](./discussion.md) - Design discussion points

### Implementation
- [implementation-notes.md](./implementation-notes.md) - **Notes on actual implementation scope** (deviations from plan)

## Quick Summary

### What We're Building

A composable transform pipeline that:
1. Executes server-side only (config never exposed to clients)
2. Consists of ordered transformation nodes
3. Can reference inputs from previous steps (text answers, captured media)
4. Supports multiple output formats (image → GIF → video in future)

### Key Decisions Made

| Decision | Choice |
|----------|--------|
| Config Storage | **Embedded in experience doc** (no separate collection) |
| Schema Position | Separate `transform` field (not in steps array) |
| Validation | Loose on draft save, strict on publish |
| Transform Position | Always last (enforced by separate slot) |
| Transforms per Experience | One |
| Step Naming | Add `name` field to all steps |
| Variable Location | Root-level `variableMappings` |
| Variable Defaults | Support `defaultValue` for fallbacks |
| Timeout | 10 minutes |
| Guest Progress | Generic loading state (no customization) |
| AI Retries | None - single attempt |
| Error UX | Friendly message + "Start Over" button |

### Key Constraints

- **Security**: Transform config (prompts, node details) must stay server-side
- **Flexibility**: Nodes must be composable and reorderable
- **Extensibility**: Easy to add new node types
- **Performance**: Must complete in 10 minutes max

### Node Types (MVP)

| Internal | Display Name | Icon | Description |
|----------|--------------|------|-------------|
| `removeBackground` | **Cut Out** | ✂️ | Extract subject from image |
| `composite` | **Combine** | 🔲 | Layer multiple images together |
| `backgroundSwap` | **Background Swap** | 🖼️ | Replace background (convenience node) |
| `aiImage` | **AI Image** | ✨ | AI transformation with dynamic prompts |

### Future Node Types

| Internal | Display Name | Icon |
|----------|--------------|------|
| `aiVideo` | **AI Video** | 🎬 |
| `aiText` | **AI Text** | 📝 |
