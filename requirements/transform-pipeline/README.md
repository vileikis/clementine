# Transform Pipeline Step - Requirements

## Overview

The Transform Pipeline step is a special step type that processes media (photos, GIFs, videos) through a configurable sequence of transformation nodes. Unlike other steps that collect user input, the transform step executes server-side processing using AI models and image manipulation tools.

## Status

**Phase**: Requirements Complete (Ready for Implementation Planning)
**Last Updated**: 2026-01-19

## Documents

- [spec.md](./spec.md) - Detailed technical specification
- [use-cases.md](./use-cases.md) - Detailed use case examples
- [decisions.md](./decisions.md) - **Finalized decisions** (20 decisions made)
- [open-questions.md](./open-questions.md) - Original questions (now answered)
- [risks.md](./risks.md) - Risk analysis and mitigations
- [discussion.md](./discussion.md) - Design discussion points

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
| Config Storage | `/experiences/{expId}/transformConfigs/{stepId}` |
| Validation | Loose on draft save, strict on publish |
| Transform Position | Must be last step in experience |
| Transforms per Experience | One (MVP) |
| Step Naming | Add `name` field to all steps |
| Variable Location | Root-level `variableMappings` (not in nodes) |
| Variable Creation | Admin-defined, decoupled from step names |
| Timeout | 10 minutes |
| Guest Progress | Progress bar + generic messages |

### Key Constraints

- **Security**: Transform config (prompts, node details) must stay server-side
- **Flexibility**: Nodes must be composable and reorderable
- **Extensibility**: Easy to add new node types
- **Performance**: Must complete in 10 minutes max

### Node Types (MVP)

1. **Remove Background** - Extract subject from image
2. **Background Swap** - Apply static OR AI-generated background
3. **Apply Overlay** - Add frames, watermarks, branding
4. **AI Image** - Full AI transformation with dynamic prompts

### Future Node Types

- Compose GIF (multi-frame)
- Apply Video Background
- Face Swap
- Style Transfer
