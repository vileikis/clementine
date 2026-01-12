# Quickstart: Experience Data Layer & Library

**Feature**: 021-experience-data-library
**Date**: 2026-01-12
**Purpose**: Implementation reference for developers

---

## Prerequisites

Before starting implementation:

1. **Read the spec**: `specs/021-experience-data-library/spec.md`
2. **Review the plan**: `specs/021-experience-data-library/plan.md`
3. **Understand data model**: `specs/021-experience-data-library/data-model.md`
4. **Check existing patterns**: `domains/workspace/projects/` for reference

---

## Implementation Order

### Phase 1: Schema & Security Rules

**Files to modify**:
- `domains/experience/shared/schemas/experience.schema.ts` - Update schema
- `domains/experience/shared/types/profile.types.ts` - Update profile validators
- `firebase/firestore.rules` - Add experience rules
- `firebase/firestore.indexes.json` - Add composite indexes

**Schema changes**:
```typescript
// Update profile enum
export const experienceProfileSchema = z.enum(['freeform', 'survey', 'story'])

// Add media schema
export const experienceMediaSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
}).nullable()

// Update experience schema (see data-model.md for full schema)
```

**Security rules to add**:
```javascript
match /workspaces/{workspaceId}/experiences/{experienceId} {
  allow read: if request.auth != null;
  allow create, update: if isAdmin();
  allow delete: if false;
}
```

---

### Phase 2: Data Hooks

**Files to create**:
```
domains/experience/shared/
├── queries/
│   ├── experience.query.ts      # Query options factories
│   └── index.ts
├── hooks/
│   ├── useWorkspaceExperiences.ts
│   ├── useWorkspaceExperience.ts
│   ├── useCreateExperience.ts
│   ├── useUpdateExperience.ts
│   ├── useDeleteExperience.ts
│   └── index.ts
└── schemas/
    └── experience.input.schemas.ts  # Input validation schemas
```

**Pattern reference**: Copy structure from `domains/workspace/projects/hooks/`

**Key implementation notes**:
- Use `runTransaction` with `serverTimestamp()` for all mutations
- Set up `onSnapshot` listener in `useEffect` for real-time updates
- Use `convertFirestoreDoc` utility for Firestore → schema conversion
- Follow query key convention: `['experiences', workspaceId, ...]`

---

### Phase 3: Library UI

**Files to create**:
```
domains/experience/library/
├── containers/
│   ├── ExperiencesPage.tsx
│   └── index.ts
├── components/
│   ├── ExperienceListItem.tsx
│   ├── ExperienceListEmpty.tsx
│   ├── ProfileBadge.tsx
│   └── index.ts
└── index.ts
```

**Route to create**:
```
app/workspace/$workspaceSlug.experiences/index.tsx
```

**Component structure**:
```tsx
// ExperiencesPage.tsx
export function ExperiencesPage({ workspaceId, workspaceSlug }) {
  const [profileFilter, setProfileFilter] = useState<ExperienceProfile | null>(null)
  const { data: experiences, isLoading, error } = useWorkspaceExperiences(
    workspaceId,
    profileFilter ? { profile: profileFilter } : undefined
  )

  if (error) return <ErrorState error={error} />

  return (
    <div className="p-6">
      <Header>
        <ProfileFilterTabs value={profileFilter} onChange={setProfileFilter} />
        <CreateExperienceButton workspaceSlug={workspaceSlug} />
      </Header>

      <ExperiencesList
        experiences={experiences || []}
        isLoading={isLoading}
        onEdit={...}
        onDelete={...}
      />
    </div>
  )
}
```

---

### Phase 4: Create Flow

**Files to create**:
```
domains/experience/library/
├── containers/
│   └── CreateExperiencePage.tsx
├── components/
│   ├── CreateExperienceForm.tsx
│   └── ProfileSelector.tsx
```

**Route to create**:
```
app/workspace/$workspaceSlug.experiences/create.tsx
```

**Form structure**:
```tsx
// CreateExperienceForm.tsx
export function CreateExperienceForm({ workspaceId, onSuccess }) {
  const createExperience = useCreateExperience()
  const form = useForm<CreateExperienceInput>({
    resolver: zodResolver(createExperienceInputSchema),
    defaultValues: { name: '', profile: 'freeform' },
  })

  const onSubmit = async (data) => {
    try {
      const result = await createExperience.mutateAsync({
        workspaceId,
        ...data,
      })
      toast.success('Experience created')
      onSuccess(result.experienceId)
    } catch {
      toast.error('Failed to create experience')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="name" ... />
        <ProfileSelector control={form.control} />
        <Button type="submit" disabled={createExperience.isPending}>
          {createExperience.isPending ? 'Creating...' : 'Create Experience'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### Phase 5: Editor Shell & Polish

**Files to create**:
```
domains/experience/library/
├── containers/
│   └── ExperienceEditorPage.tsx
├── components/
│   ├── RenameExperienceDialog.tsx
│   └── DeleteExperienceDialog.tsx
```

**Route to create**:
```
app/workspace/$workspaceSlug.experiences/$experienceId.tsx
```

**Editor shell**:
```tsx
// ExperienceEditorPage.tsx (placeholder for E2)
export function ExperienceEditorPage({ workspaceId, experienceId }) {
  const { data: experience, isLoading } = useWorkspaceExperience(workspaceId, experienceId)

  if (isLoading) return <LoadingSkeleton />
  if (!experience) return <NotFound />

  return (
    <div className="p-6">
      <Breadcrumb items={[
        { label: 'Experiences', href: `/workspace/${workspaceSlug}/experiences` },
        { label: experience.name },
      ]} />

      <div className="mt-8 text-center text-muted-foreground">
        <p>Step editor coming in E2</p>
      </div>
    </div>
  )
}
```

---

## Testing Checklist

### Unit Tests (hooks)
- [ ] `useWorkspaceExperiences` returns filtered list
- [ ] `useCreateExperience` creates with correct defaults
- [ ] `useDeleteExperience` sets soft delete fields
- [ ] Real-time updates propagate to cache

### Component Tests
- [ ] `ExperiencesPage` renders list and empty states
- [ ] `CreateExperienceForm` validates and submits
- [ ] `ProfileBadge` displays correct colors
- [ ] Dialogs open/close correctly

### Integration Tests
- [ ] Create → appears in list
- [ ] Delete → removed from list
- [ ] Rename → name updates
- [ ] Profile filter → correct filtering

---

## Common Patterns

### Profile Badge Colors
```tsx
const profileColors: Record<ExperienceProfile, string> = {
  freeform: 'bg-blue-100 text-blue-800',
  survey: 'bg-green-100 text-green-800',
  story: 'bg-purple-100 text-purple-800',
}
```

### Profile Descriptions
```tsx
const profileDescriptions: Record<ExperienceProfile, string> = {
  freeform: 'Full flexibility with any step types',
  survey: 'Data collection with info, input, and capture steps',
  story: 'Display-only with info steps',
}
```

### Publish Status Badge
```tsx
function getPublishStatus(experience: Experience) {
  if (!experience.published) return 'Draft'
  if (experience.publishedAt && experience.updatedAt > experience.publishedAt) {
    return 'Draft (unpublished changes)'
  }
  return 'Published'
}
```

---

## Validation Commands

Before committing:

```bash
# From apps/clementine-app/
pnpm check        # Format + lint fixes
pnpm type-check   # TypeScript
pnpm test         # Unit tests

# Deploy rules (if changed)
pnpm fb:deploy:rules
pnpm fb:deploy:indexes
```

---

## Reference Files

| Purpose | File |
|---------|------|
| Hook patterns | `domains/workspace/projects/hooks/*.ts` |
| Dialog patterns | `domains/workspace/projects/components/*Dialog.tsx` |
| Form patterns | `domains/workspace/settings/components/WorkspaceSettingsForm.tsx` |
| Query patterns | `domains/project/shared/queries/project.query.ts` |
| Route patterns | `app/workspace/$workspaceSlug.projects/*.tsx` |
| Firestore utils | `shared/utils/firestore-utils.ts` |
