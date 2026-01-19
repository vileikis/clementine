# Transform Pipeline Step - Requirements

## Overview

The Transform Pipeline step is a special step type that processes media (photos, GIFs, videos) through a configurable sequence of transformation nodes. Unlike other steps that collect user input, the transform step executes server-side processing using AI models and image manipulation tools.

## Status

**Phase**: Requirements Gathering
**Last Updated**: 2026-01-19

## Documents

- [spec.md](./spec.md) - Detailed technical specification
- [use-cases.md](./use-cases.md) - Detailed use case examples
- [open-questions.md](./open-questions.md) - Questions requiring decisions

## Quick Summary

### What We're Building

A composable transform pipeline that:
1. Executes server-side only (config never exposed to clients)
2. Consists of ordered transformation nodes
3. Can reference inputs from previous steps (text answers, captured media)
4. Supports multiple output formats (image → GIF → video in future)

### Key Constraints

- **Security**: Transform config (prompts, node details) must stay server-side
- **Flexibility**: Nodes must be composable and reorderable
- **Extensibility**: Easy to add new node types
- **Performance**: Must complete in reasonable time for guest experience

### Node Types (MVP)

1. Remove Background
2. Background Swap (static image)
3. Apply Overlay
4. AI Image Generation

### Future Node Types

- Compose GIF
- Apply Video Background
- Face Swap
- Style Transfer
