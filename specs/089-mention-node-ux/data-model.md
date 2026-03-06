# Data Model: Lexical Mention Node UX Improvements

**Feature Branch**: `089-mention-node-ux`
**Date**: 2026-03-06

## Overview

This feature does not introduce new data entities or modify existing data schemas. The changes are purely at the Lexical editor presentation and interaction layer — DOM attributes, CSS, and a new plugin for delete functionality.

## Existing Entities (No Changes)

### StepMentionNode

An inline text entity representing a reference to an experience step.

| Field | Type | Description |
|-------|------|-------------|
| `__stepName` | `string` | Display name of the referenced step |
| `__stepType` | `ExperienceStepType` | Type classification of the step |
| `__isInvalid` | `boolean` | Whether the referenced step still exists |

**Serialization format**: `@{step:stepName}`

### MediaMentionNode

An inline text entity representing a reference to a media asset.

| Field | Type | Description |
|-------|------|-------------|
| `__mediaName` | `string` | Display name of the media asset |
| `__isInvalid` | `boolean` | Whether the referenced media still exists |

**Serialization format**: `@{ref:mediaName}`

## State Transitions

No state transitions are affected. The `__isInvalid` boolean state remains unchanged. The new delete action removes the entire node rather than transitioning its state.

## Impact on Persistence

No impact. The serialization format (`@{step:name}` / `@{ref:name}`) and deserialization logic remain identical. When a mention node is deleted via the new close icon, the serialized output simply no longer contains that mention — identical to deleting via keyboard.
