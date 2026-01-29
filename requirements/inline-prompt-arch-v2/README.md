# Inline Prompt Architecture (v2)

**Status**: Approved for Implementation
**Created**: 2026-01-29
**Supersedes**: AI Presets (Phases 1-4) and inline-prompt-architecture.md (v1)

---

## Executive Summary

This document specifies the **Inline Prompt Architecture** - a streamlined approach to AI prompt configuration that embeds all prompt logic directly in Experience transform pipelines. No separate preset or template libraries - just inline configuration with direct step references.

### Core Principles

1. **Inline Configuration**: All AI prompt config lives in Experience transform pipeline
2. **Direct Step References**: Prompts reference experience steps by name using `@` mentions
3. **Three-Format System**: Storage (parseable) → Display (user-friendly) → Resolved (LLM-ready)
4. **MediaAssetId-Based**: All media references use stable mediaAssetIds, not names
5. **Auto-Reference Pattern**: Step option media automatically included in prompts
6. **No Template Library**: Focus on inline simplicity (templates may come later)

### Key Features

✅ **Simple workflow**: No preset mapping, no variable bindings
✅ **Direct mentions**: `@stepName` and `@mediaName` in Lexical editor
✅ **Stable references**: MediaAssetId-based (never breaks)
✅ **Auto-composition**: Step promptFragments compose into final prompt
✅ **Visual editing**: Lexical editor with colored pills (blue steps, green media)
✅ **Live testing**: Test run dialog with real-time resolution
✅ **LLM-ready**: Resolved prompt matches Gemini API format exactly

---

## Documentation Structure

This specification is organized into focused documents:

### Core Specifications

1. **[Architecture](./architecture.md)** - System architecture, data flow, and core concepts
2. **[Three-Format System](./three-format-system.md)** - Storage, display, and resolved format specifications
3. **[Data Models](./data-models.md)** - Schemas for steps, nodes, and media references
4. **[Resolution Algorithm](./resolution-algorithm.md)** - Complete prompt resolution logic and examples

### Implementation Guides

5. **[Lexical Editor](./lexical-editor.md)** - Lexical integration, mention nodes, and autocomplete
6. **[User Workflows](./user-workflows.md)** - End-to-end user scenarios and examples
7. **[Validation](./validation.md)** - Edge cases, validation rules, and error handling

### Project Management

8. **[Implementation Plan](./plan.md)** - Phased implementation roadmap and task breakdown

---

## Quick Start

### For Product Managers

Start with:
1. [Architecture](./architecture.md) - Understand the system design
2. [User Workflows](./user-workflows.md) - See how users will interact with the feature

### For Developers

Start with:
1. [Data Models](./data-models.md) - Understand the schemas
2. [Resolution Algorithm](./resolution-algorithm.md) - Core business logic
3. [Implementation Plan](./plan.md) - Build phases and tasks

### For Designers

Start with:
1. [User Workflows](./user-workflows.md) - User interaction patterns
2. [Lexical Editor](./lexical-editor.md) - UI components and editor behavior

---

## System Overview

```
Experience Document
├── steps: ExperienceStep[]
│   ├── capture-photo
│   ├── input-multi-select (AI-aware options)
│   │   └── options: [
│   │       { value, promptFragment?, promptMedia? }
│   │     ]
│   └── input-short-text
│
└── transformConfig
    └── nodes: [
        {
          type: "ai.imageGeneration",
          config: {
            model: "gemini-2.5-pro",
            aspectRatio: "3:2",
            prompt: "@{step:captureStep} @{step:petStep} @{ref:abc123}",
            refMedia: [
              { mediaAssetId, url, filePath, displayName }
            ]
          }
        }
      ]
```

---

## Key Concepts

### Three-Format System

| Format | Purpose | Example |
|--------|---------|---------|
| **Storage** | Parseable, stored in Firestore | `@{step:captureStep}` `@{ref:abc123}` |
| **Display** | User-friendly in Lexical editor | `@captureStep` (blue pill) `@artStyle` (green pill) |
| **Resolved** | LLM-ready text | `<cap789>` `<abc123>` |

See [Three-Format System](./three-format-system.md) for details.

### Step References

Prompts reference experience steps directly:
- Capture steps → `<mediaAssetId>` placeholders
- Multiselect steps → `promptFragment` + auto-referenced `promptMedia`
- Text steps → Raw input values

See [Resolution Algorithm](./resolution-algorithm.md) for complete logic.

### RefMedia

Node-level reference media for style guides, overlays, etc.:
- Uploaded to AI node
- Auto-generated `displayName` (editable)
- Referenced with `@displayName` in editor
- Stored as `@{ref:mediaAssetId}`

See [Data Models](./data-models.md) for schema details.

---

## Implementation Timeline

**Phase 1: Core Features** (~4-5 weeks)
- Schemas & Foundation
- Step Editor Enhancement
- RefMedia Management
- Lexical Prompt Editor
- Resolution Logic
- Test Run Dialog
- Transform Pipeline Integration

See [Implementation Plan](./plan.md) for detailed breakdown.

---

## Future Enhancements (Out of Scope)

**Phase 2**: Yes/No steps with AI-aware options
**Phase 3**: Template library (if needed)
**Phase 4**: Advanced features (auto-update references, versioning, analytics)
**Phase 5**: DisplayMedia field for step options

---

## Related Documents

- **Original Architecture (v1)**: `requirements/inline-prompt-architecture.md`
- **AI Presets Implementation**: `requirements/ai-presets/` (archived)
- **Variable Mapping Architecture**: `requirements/transform-pipeline/variable-mapping-architecture.md`

---

## Questions or Feedback?

For questions about this specification:
1. Check the relevant focused document
2. Review [Validation](./validation.md) for edge cases
3. Consult [Implementation Plan](./plan.md) for task details
