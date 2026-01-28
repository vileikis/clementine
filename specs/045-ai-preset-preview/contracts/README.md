# API Contracts

**Feature**: 045-ai-preset-preview

## No Contracts

This feature is **client-side only** with no backend endpoints or API contracts.

The preview panel reads existing Firestore data and operates entirely in the browser using:
- Firestore Client SDK (read-only access)
- Firebase Storage (for test image uploads)
- Local component state (test inputs)

See [data-model.md](../data-model.md) for entity definitions.
