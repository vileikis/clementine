# @clementine/shared

Shared Zod schemas and TypeScript types for the Clementine monorepo. This package provides type-safe validation schemas used by both the frontend application and Firebase Cloud Functions.

## Installation

This package is automatically available to other workspaces via pnpm:

```bash
# From another workspace in the monorepo
pnpm add @clementine/shared --filter <workspace-name>
```

## Usage

```typescript
import { sessionSchema, experienceSchema, jobSchema } from '@clementine/shared'

// Validate session data
const session = sessionSchema.parse(data)

// Get TypeScript types
type Session = z.infer<typeof sessionSchema>
```

## Schema Domains

The package organizes schemas by domain:

### Session

Guest session data for photo/video experiences.

### Job

Transform pipeline execution and job status tracking.

### Experience

Experience definitions including step configurations:
- `info` - Information display steps
- `capture-photo` - Photo capture steps
- `input-*` - Various input types (short text, long text, scale, yes/no, multi-select)
- `transform-pipeline` - AI transformation steps

### Event

Project event schemas including configuration and experiences.

### Project

Project-level schemas for workspace organization.

### Workspace

Workspace schemas for multi-tenant support.

### Theme

Theme configuration including media references and styling constants.

### Media

Media asset schemas for unified media handling across the platform:
- `mediaAssetSchema` - Complete media asset document (Firestore)
- `mediaReferenceSchema` - Lightweight reference for embedding in other documents
- `imageMimeTypeSchema` - Allowed image MIME types
- `mediaAssetTypeSchema` - Asset categorization (overlay, logo, other)
- `mediaAssetStatusSchema` - Lifecycle status (active, deleted)

The `mediaReferenceSchema` includes a nullable `filePath` field for backward compatibility:
- New uploads populate `filePath` for direct storage access
- Legacy documents have `filePath: null` and use URL parsing as fallback

```typescript
import { mediaReferenceSchema, type MediaReference } from '@clementine/shared'

// Create reference with filePath for new uploads
const ref: MediaReference = {
  mediaAssetId: 'abc123',
  url: 'https://firebasestorage.googleapis.com/...',
  filePath: 'workspaces/ws-123/media/overlay-abc.png',
}

// Legacy documents parse with filePath defaulting to null
const legacy = mediaReferenceSchema.parse({
  mediaAssetId: 'old123',
  url: 'https://firebasestorage.googleapis.com/...',
})
// legacy.filePath === null
```

## Development

```bash
# Build the package
pnpm build

# Watch mode during development
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Clean build artifacts
pnpm clean
```

## Architecture

- **Zod 4.x** - Runtime validation with TypeScript inference
- **TypeScript** - Strict mode with ES2020 target
- **Vitest** - Testing framework

## Adding New Schemas

1. Create schema file in appropriate domain folder under `src/schemas/`
2. Export from the domain's `index.ts`
3. The schema will be automatically available via the main export

Example structure:
```
src/schemas/
├── index.ts              # Barrel export
├── <domain>/
│   ├── index.ts          # Domain barrel export
│   ├── <entity>.schema.ts
│   └── <entity>.schema.test.ts
```

## Testing

Tests are co-located with schema files using the `.test.ts` suffix:

```bash
pnpm test
```
