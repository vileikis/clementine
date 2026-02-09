# Contract: Theme Schema Extension

**Feature**: 066-google-fonts
**Package**: `@clementine/shared`
**File**: `packages/shared/src/schemas/theme/theme.schema.ts`

## Zod Schema Changes

### New Fields on `themeSchema`

```typescript
// New constants
export const FONT_SOURCE_OPTIONS = ['google', 'system'] as const
export type FontSource = (typeof FONT_SOURCE_OPTIONS)[number]

export const DEFAULT_FONT_SOURCE: FontSource = 'system'
export const DEFAULT_FONT_VARIANTS: number[] = [400, 700]
export const DEFAULT_FALLBACK_STACK = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'

// Extended schema
export const themeSchema = z.object({
  // Existing fields (unchanged)
  fontFamily: z.string().nullable().default(null),
  primaryColor: z.string().regex(COLOR_REGEX).default(DEFAULT_PRIMARY_COLOR),
  text: themeTextSchema.default(DEFAULT_TEXT),
  button: themeButtonSchema.default(DEFAULT_BUTTON),
  background: themeBackgroundSchema.default(DEFAULT_BACKGROUND),

  // New fields
  fontSource: z.enum(FONT_SOURCE_OPTIONS).default(DEFAULT_FONT_SOURCE),
  fontVariants: z.array(z.number()).default(DEFAULT_FONT_VARIANTS),
  fallbackStack: z.string().default(DEFAULT_FALLBACK_STACK),
})
```

### Exported Types

```typescript
export type Theme = z.infer<typeof themeSchema>
// Theme now includes:
// {
//   fontFamily: string | null
//   fontSource: "google" | "system"
//   fontVariants: number[]
//   fallbackStack: string
//   primaryColor: string
//   text: ThemeText
//   button: ThemeButton
//   background: ThemeBackground
// }
```

### Constants to Export

Add to `theme.constants.ts`:
```typescript
export const DEFAULT_FONT_SOURCE = 'system' as const
export const DEFAULT_FONT_VARIANTS = [400, 700]
export const DEFAULT_FALLBACK_STACK = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
```

### Backward Compatibility

All new fields have Zod defaults. `themeSchema.parse({})` produces valid output. Existing Firestore documents missing these fields parse correctly.

### Consumers to Update

1. `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts` — add re-exports for new constants and types
2. `apps/clementine-app/src/domains/project-config/theme/containers/ThemeEditorPage.tsx` — add `fontSource`, `fontVariants`, `fallbackStack` to `THEME_FIELDS_TO_COMPARE`
