# Contracts: Gemini 3.1 Flash Image Model Support

**Feature**: 085-gemini-3-1-model
**Date**: 2026-02-28

## No New API Contracts

This feature does not introduce any new API endpoints, request/response schemas, or external contracts.

The existing Vertex AI `generateContent` API call in `aiGenerateImage.ts` already accepts any model string. The only change is routing the new model identifier to the correct region (`global`), which is handled internally.

### Existing Contracts (Unchanged)

- **Vertex AI `generateContent`**: Accepts model name, content parts, and generation config. No changes to request/response format.
- **Experience Config Schema**: The `imageGenerationConfig.model` field accepts any value from `aiImageModelSchema`. Adding a new enum value extends valid inputs without changing the contract shape.
