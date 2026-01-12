# Experience System Overview

> **Related Documents:**
> - [Architecture: Experiences System](./arch-experiences-system.md)
> - Epic PRDs (see below)

---

## Vision

Enable admins to create reusable, step-based experiences at the workspace level and connect them to events for guest consumption.

**Key user journeys:**

1. **Admin** creates experiences in the Experience Library
2. **Admin** connects experiences to events via the Event Designer
3. **Admin** configures share screen for the event
4. **Guest** visits event link, sees welcome screen with experiences
5. **Guest** completes experience steps (info, input, capture)
6. **Guest** shares/downloads result via share screen

---

## Epic Roadmap

| Epic | Name | Description | Dependencies |
|------|------|-------------|--------------|
| **E1** | [Data Layer & Library](./epic-e1-data-layer-library.md) | Experience CRUD, library UI, profiles | None |
| **E2** | [Step System & Editor](./epic-e2-step-system-editor.md) | Step registry, experience editor, edit renderers | E1 |
| **E3** | [Event Integration](./epic-e3-event-experience-integration.md) | SlotManager, Welcome WYSIWYG | E1 |
| **E4** | [Share Screen Editor](./epic-e4-share-screen-editor.md) | Event designer share tab | E1 |
| **E5** | [Session & Runtime](./epic-e5-session-runtime-capture.md) | Session domain, runtime engine, photo capture | E2 |
| **E6** | [Guest Access & Welcome](./epic-e6-guest-access-welcome.md) | Join route, welcome screen (run mode) | E3 |
| **E7** | [Guest Execution](./epic-e7-guest-experience-execution.md) | Runtime integration, pregate/preshare flow | E5, E6 |
| **E8** | [Share Screen Guest](./epic-e8-share-screen-guest.md) | Download, social sharing, CTA | E4, E7 |
| **E9** | [Transform Pipeline](./epic-e9-transform-pipeline.md) | AI processing (TBD) | E7 |

---

## Dependency Graph

```
E1 (Data Layer & Library)
 ├─────────┬─────────┬─────────┐
 ↓         ↓         ↓         ↓
E2        E3        E4       (parallel track)
(Steps)   (Event)   (Share Ed)
 ↓         ↓
E5        E6
(Runtime) (Guest Access)
 └────┬────┘
      ↓
     E7 (Guest Execution)
      ↓
 ├────┴────┐
 ↓         ↓
E8        E9
(Share)   (Transform)
```

**Parallelization:** E2, E3, and E4 can run in parallel after E1 completes.

---

## Frozen Decisions

These decisions are final unless reality breaks them:

### Data Model

| Decision | Rationale |
|----------|-----------|
| Experiences are **workspace-scoped** | Reusable across events |
| Experience Library is **dedicated UX** | Not event-scoped editing |
| **Draft/published** on same doc | No separate releases collection |
| All events share **current published** version | Simpler model, instant updates |
| **Media flattened** at root level | Easy list display |
| Sessions stored under **workspace** | Consistent with experiences |

### Profiles

| Profile | Description | Allowed Steps | Slots |
|---------|-------------|---------------|-------|
| `freeform` | Full flexibility | info, input, capture, transform | main |
| `survey` | Data collection | info, input, capture | main, pregate, preshare |
| `story` | Display only | info | pregate, preshare |

Profile is **immutable** after experience creation.

### Share Screen

| Decision | Rationale |
|----------|-----------|
| Share screen is **event-scoped** | Consistent across all experiences |
| Configured in **event designer** | Not an experience step |
| Separate from experience runtime | Clean separation |

### Routes

| Route | Purpose |
|-------|---------|
| `/workspace/:slug/experiences` | Experience library |
| `/workspace/:slug/experiences/create` | Create experience |
| `/workspace/:slug/experiences/:id` | Experience editor |
| `/join/:projectId` | Guest welcome |
| `/join/:projectId/experience/:id` | Guest experience |
| `/join/:projectId/share` | Guest share screen |

---

## Key Concepts

### Experience

Workspace-scoped, reusable container for steps. Has draft and published versions.

```typescript
{
  id, name, profile, media,
  draft: { steps: [] },
  published: { steps: [] } | null,
  createdAt, updatedAt, publishedAt, publishedBy
}
```

### Step

Unit of interaction within an experience.

**Categories:** info, input, capture, transform

**Types:** info, input.scale, input.yesNo, input.multiSelect, input.shortText, input.longText, capture.photo, transform.pipeline

### Session

Execution instance of an experience. Tracks progress, answers, captured media.

**Modes:** preview (admin testing), guest (real users)

### Slot

Position in event flow where experience can be assigned.

| Slot | Cardinality | When |
|------|-------------|------|
| `main` | Array | Welcome screen picker |
| `pregate` | Single | Before welcome |
| `preshare` | Single | After experience, before share |

---

## Out of Scope (MVP)

These are explicitly NOT included in the current epic series:

- Experience Library search/filters (beyond profile filter)
- Experience templates/marketplace
- Experience version history
- Video/GIF capture
- Transform processing (placeholder only)
- Analytics dashboards
- Role/permission granularity
- Cross-workspace sharing

---

## Architecture Reference

See [arch-experiences-system.md](./arch-experiences-system.md) for:

- Domain boundaries and import rules
- Step registry design
- Runtime engine interface
- Session integration patterns
- WYSIWYG rendering strategy
