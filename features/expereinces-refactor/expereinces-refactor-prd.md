# Experiences Feature Refactor PRD

## Overview

Migrate the Experiences feature from a subcollection architecture (`/events/{eventId}/experiences`) to a top-level collection (`/experiences/{experienceId}`) following the normalized Firestore design in data-model-v4.

## Current State

- Experiences stored as subcollection under Events
- Schema uses `eventId` as parent reference
- CRUD operations coupled to event document path
- No `companyId` ownership field

## Target State

- Experiences stored in root `/experiences` collection
- Schema aligned with data-model-v4 specification
- Events reference experiences via `experienceIds` array
- Company-scoped ownership for multi-tenant support

---

## Requirements

### 1. Schema Changes

**Replace `eventId` with `companyId`**

- Experiences belong to a company, not an event
- Enables experience reuse across multiple events

**Add new fields from data-model-v4:**

- `name` (string) - Internal name for the experience
- `previewMediaUrl` (string, optional) - Preview asset URL
- `captureConfig` - Hardware/capture settings object
- `aiConfig` - Type-specific AI configuration (see section 1.1)

**Defer `inputFields`**

- `inputFields` field should be nullable/optional
- Full implementation deferred to future iteration

### 1.1 Type-Specific AI Configurations

AI config schemas are separated by experience type due to different model capabilities and parameters.

**Photo/GIF AI Config (`aiPhotoConfig`):**

- `enabled` (boolean)
- `model` (string, nullable) - e.g., "stable-diffusion-xl", "flux"
- `prompt` (string, nullable) - What to generate
- `referenceImageUrls` (string[], nullable) - Style/subject reference images
- `aspectRatio` (enum) - Output dimensions

**Video AI Config (`aiVideoConfig`):**

- `enabled` (boolean)
- `model` (string, nullable) - e.g., "kling-video", "runway"
- `prompt` (string, nullable) - Motion/scene description
- `referenceImageUrls` (string[], nullable) - Starting frame or style reference
- `aspectRatio` (enum) - Output dimensions
- `duration` (number, nullable) - Output length in seconds
- `fps` (number, nullable) - Frames per second

**Note:** GIF experiences use `aiPhotoConfig` (generates frames via image models).

**Remove legacy fields:**

- `eventId` - replaced by Event's `experienceIds` reference
- `label` - replaced by `name`
- `hidden` - no longer needed

### 2. Data Access Pattern

**Fetching Experiences for an Event:**

1. Read `experienceIds` array from the Event document
2. Fetch matching documents from `/experiences` collection
3. Return experiences in array order (preserve ordering)

**Fetching Experiences for a Company:**

1. Query `/experiences` where `companyId` equals target company
2. Use for experience library/picker interfaces

### 3. CRUD Operations

#### Create Experience

1. Validate user has access to the target `companyId`
2. Navigate to Experience Editor page (full window)
3. On save:
   - Create document in `/experiences` with `companyId`
   - Push new experience ID to `event.experienceIds` array
4. Return to Event Design Tab

#### Read Experience

- Fetch by document ID from `/experiences/{experienceId}`
- Validate `companyId` matches user's company for authorization

#### Update Experience

- Update document in `/experiences/{experienceId}`
- No event document update needed (reference unchanged)

#### Delete Experience

1. Delete document from `/experiences/{experienceId}`
2. Remove experience ID from all events' `experienceIds` arrays that reference it
3. Clean up associated storage assets

### 4. UI Behavior

**Location:** Event Studio > Design Tab > Experiences Sidebar

**Empty State (0 experiences):**

- Display "Add your first Experience" illustration
- Show prominent create button

**Non-empty State (1+ experiences):**

- Automatically select and display first experience
- Show experience list in sidebar
- Support reordering (updates `event.experienceIds` order)

### 5. Storage

Use existing storage infrastructure from `@/lib/storage/actions.ts` for:

- Preview media uploads
- Reference images
- Overlay frames

---

## Out of Scope

- `inputFields` implementation (deferred)
- Experience duplication/cloning
- Cross-company experience sharing
- Experience versioning
