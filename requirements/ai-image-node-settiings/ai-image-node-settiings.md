## AI Image Node Settings — Functional Spec

### Purpose

Allow an admin to configure an **AI Image** transform node by editing:

- AI model
- output aspect ratio
- prompt text
- optional reference images (picked or dropped)

### Data & Validation (expected schemas)

Configuration must conform to the following schemas (as provided):

- `mediaReferenceSchema`
- `aiImageModelSchema`
- `aiImageAspectRatioSchema`
- `aiImageNodeConfigSchema`
  - `model` (required)
  - `aspectRatio` (required)
  - `prompt` (required, non-empty)
  - `refMedia` (optional array; may be empty)

See /Users/iggyvileikis/Projects/@attempt-n2/ai-iamge-node-settings/packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts

Domain where to implement this:
/Users/iggyvileikis/Projects/@attempt-n2/ai-iamge-node-settings/apps/clementine-app/src/domains/experience/generate

---

## PromptComposer UI

### High-level layout rules

- The PromptComposer is a **single rounded bordered container**.
- Elements inside the container **do not have their own borders**.
- Reference media (if any) appears **inside the container above the prompt input**.
- A control row sits **inside the container below the prompt input**.
- The composer supports **drag & drop images anywhere within the composer area**.

---

## Pseudolayout (desired)

```
PromptComposer (outer, rounded border, single container)
┌────────────────────────────────────────────────────────────┐
│  [REF MEDIA STRIP]  (only if refMedia.length > 0)          │
│  ┌───────┐ ┌───────┐ ┌───────┐                             │
│  │ thumb │ │ thumb │ │ thumb │    ...                      │
│  │ name  │ │ name  │ │ name  │                             │
│  │   ✕   │ │   ✕   │ │   ✕   │                             │
│  └───────┘ └───────┘ └───────┘                             │
│                                                            │
│  [PROMPT INPUT]                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Multiline prompt input (no border)                   │  │
│  │ "A cinematic portrait of @{step:userName} ..."       │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [BOTTOM ROW]                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Model ▼]  [Aspect ▼]                       (spacer) +│  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘


DRAG & DROP STATE
- When dragging images over any part of the composer:
  - the entire container shows a highlight/active state
  - dropping adds images as reference media
```

---

## Functional requirements

### 1) Prompt input

- Must allow editing a **non-empty** prompt string (`prompt`).
- Prompt supports plain text plus placeholders:
  - `@{step:<stepName>}`
  - `@{ref:<mediaAssetId>}`

- If prompt is empty, the UI must show a clear validation error (e.g., “Prompt is required”).

### 2) Model picker (no label)

- Must allow selecting one value from `aiImageModelSchema`.
- Changing the selection updates `config.model`.

### 3) Aspect ratio picker (no label)

- Must allow selecting one value from `aiImageAspectRatioSchema`.
- Changing the selection updates `config.aspectRatio`.

### 4) Reference media strip

- Displays `config.refMedia` items (may be empty).
- Each reference media item must show:
  - a visual preview (from `url`)
  - `displayName`
  - a remove control (e.g., ✕)

- Removing an item deletes it from `config.refMedia`.

### 5) Adding reference media via Plus (right-aligned)

- Plus icon is located on the **far right** of the bottom row.
- Clicking Plus opens a media picker.
- Selecting one or more images adds them to `config.refMedia` as `mediaReferenceSchema` objects.

### 6) Drag & drop images

- Dragging image files over the composer triggers a visible “drop-ready” state for the **entire** composer.
- Dropping one or more images adds them to `config.refMedia`.
- Non-image drops are rejected (no changes to config).

### 7) Duplicates & integrity

- A reference image must not appear twice in `refMedia` (dedupe by `mediaAssetId`).
- Adding references must preserve existing references (append new ones).

### 8) Empty states

- If `refMedia` is empty, the ref media strip is not shown (no empty placeholder row required).
- Model and aspect ratio pickers are always visible.

---

## Acceptance criteria (functional)

- User can edit prompt and cannot save/publish valid config if prompt is empty.
- User can change model and aspect ratio using unlabeled pickers.
- User can add reference images using Plus and by drag & drop.
- Added reference images appear above the prompt inside the bordered box and can be removed.
- Dragging images over any composer region highlights the whole composer.
- Duplicate reference media is prevented.
- Config produced matches `aiImageNodeConfigSchema` and uses `mediaReferenceSchema` for each reference item.
