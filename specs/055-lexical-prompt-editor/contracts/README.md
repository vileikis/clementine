# API Contracts

**Feature**: 055-lexical-prompt-editor

## Overview

This feature does not introduce new API endpoints. All changes are client-side within the Lexical editor component.

## Existing Contracts Used

### Firestore Document Structure

The prompt is stored in the existing `AIImageNode.config.prompt` field:

```typescript
// Path: /workspaces/{workspaceId}/experiences/{experienceId}
{
  draft: {
    transformNodes: [
      {
        id: string,
        type: "ai.imageGeneration",
        config: {
          prompt: string,  // Contains @{step:id} and @{ref:id} patterns
          // ... other config
        }
      }
    ]
  }
}
```

### Internal Type Contracts

```typescript
// StepOption - for autocomplete menu
interface StepOption {
  id: string                  // Step UUID
  name: string                // Display name
  type: ExperienceStepType    // Step type for icon
}

// MediaOption - for autocomplete menu
interface MediaOption {
  id: string    // mediaAssetId
  name: string  // displayName
}
```

## Future Considerations

When implementing server-side prompt resolution (out of scope), the cloud function will need to:

1. Parse `@{step:stepId}` patterns from prompt
2. Look up step values from session data
3. Replace mentions with resolved values
4. Handle different step types (input vs capture)

This is documented in the spec's "Resolution Logic Reference" section.
