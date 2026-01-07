# Quickstart: Themed Primitives

**Feature**: 016-themed-primitives | **Date**: 2026-01-07

## Overview

This feature creates reusable themed primitive components (`ThemedText`, `ThemedButton`) and introduces the `MediaReference` schema for media asset references.

## Prerequisites

- Node.js 20+
- pnpm 10.18.1+
- Firebase emulators (optional, for local testing)

## Getting Started

### 1. Start Development Server

```bash
cd apps/clementine-app
pnpm dev
```

The app runs at `http://localhost:3000`.

### 2. Navigate to Theme Editor

1. Log in as a workspace admin
2. Navigate to: `/workspace/{slug}/projects/{projectId}/events/{eventId}/theme`
3. The Theme Editor page shows the preview panel with themed primitives

## Using Themed Primitives

### ThemedText

Typography component that applies theme text styles.

```tsx
import { ThemedText } from '@/shared/theming'

// Within ThemeProvider - uses context
<ThemedText variant="heading">Welcome to Our Event</ThemedText>
<ThemedText variant="body">Body text with theme colors</ThemedText>
<ThemedText variant="small">Small footnote text</ThemedText>

// Override alignment
<ThemedText variant="body" align="center">Centered text</ThemedText>

// Custom HTML element
<ThemedText variant="heading" as="h2">Subheading</ThemedText>

// Without provider - pass theme directly
<ThemedText variant="body" theme={previewTheme}>Preview text</ThemedText>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'heading' \| 'body' \| 'small'` | `'body'` | Text size variant |
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'p' \| 'span' \| 'div'` | varies | HTML element |
| `align` | `'left' \| 'center' \| 'right' \| 'inherit'` | from theme | Text alignment |
| `theme` | `Theme` | from context | Theme override |
| `className` | `string` | - | Additional CSS classes |

### ThemedButton

Button component that applies theme button styles.

```tsx
import { ThemedButton } from '@/shared/theming'

// Within ThemeProvider
<ThemedButton onClick={handleClick}>Get Started</ThemedButton>
<ThemedButton size="lg">Large Button</ThemedButton>
<ThemedButton size="sm">Small Button</ThemedButton>

// Disabled state
<ThemedButton disabled>Coming Soon</ThemedButton>

// Form submit
<ThemedButton type="submit">Submit</ThemedButton>

// Without provider
<ThemedButton theme={previewTheme}>Preview Button</ThemedButton>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `type` | `'button' \| 'submit'` | `'button'` | HTML button type |
| `theme` | `Theme` | from context | Theme override |
| `className` | `string` | - | Additional CSS classes |
| `onClick` | `() => void` | - | Click handler |

### ThemedBackground

Background container with theme colors, image, and overlay.

```tsx
import { ThemedBackground } from '@/shared/theming'

<ThemedBackground
  background={theme.background}
  fontFamily={theme.fontFamily}
  className="min-h-screen"
>
  <ThemedText variant="heading">Welcome</ThemedText>
  <ThemedButton>Get Started</ThemedButton>
</ThemedBackground>
```

## Using MediaReference

### Schema

```typescript
import { mediaReferenceSchema, type MediaReference } from '@/shared/theming'

// Validate data
const validated = mediaReferenceSchema.parse({
  mediaAssetId: 'abc123',
  url: 'https://storage.googleapis.com/bucket/image.jpg'
})
```

### Storing Background Image

```typescript
// Upload returns MediaReference
const { mediaAssetId, url } = await uploadBackground(file)

// Store in theme
await updateTheme({
  background: {
    image: { mediaAssetId, url }
  }
})
```

### Accessing Image URL

```tsx
// In ThemedBackground (internal)
const imageUrl = theme.background.image?.url

// In custom components
if (theme.background.image) {
  return <img src={theme.background.image.url} alt="Background" />
}
```

## Theme Context

### With Provider (Guest Flows)

```tsx
import { ThemeProvider, ThemedText, ThemedButton } from '@/shared/theming'

function GuestExperience({ theme }: { theme: Theme }) {
  return (
    <ThemeProvider theme={theme}>
      <ThemedText variant="heading">Welcome!</ThemedText>
      <ThemedButton>Start Experience</ThemedButton>
    </ThemeProvider>
  )
}
```

### Without Provider (Admin Previews)

```tsx
import { ThemedText, ThemedButton } from '@/shared/theming'

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div>
      <ThemedText variant="heading" theme={theme}>Preview</ThemedText>
      <ThemedButton theme={theme}>Sample Button</ThemedButton>
    </div>
  )
}
```

## Directory Structure

```
shared/theming/
├── providers/
│   ├── ThemeProvider.tsx      # Theme context provider
│   └── index.ts
├── components/
│   ├── primitives/
│   │   ├── ThemedText.tsx     # Text primitive
│   │   ├── ThemedButton.tsx   # Button primitive
│   │   └── index.ts
│   ├── inputs/                # Future input components
│   │   └── index.ts
│   ├── ThemedBackground.tsx   # Background container
│   └── index.ts
├── hooks/
│   ├── useEventTheme.ts       # Access theme from context
│   ├── useThemedStyles.ts     # Compute CSS styles
│   ├── useThemeWithOverride.ts # Internal utility
│   └── index.ts
├── schemas/
│   ├── media-reference.schema.ts
│   ├── theme.schemas.ts
│   └── index.ts
├── types/
│   └── theme.types.ts
├── constants/
│   └── theme-defaults.ts
└── index.ts                   # Public API
```

## Running Tests

```bash
cd apps/clementine-app

# Run all tests
pnpm test

# Run specific test file
pnpm test theme.schemas.test.ts

# Watch mode
pnpm test --watch
```

## Validation

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Format + lint fix
pnpm check
```

## Common Issues

### "Themed components require either a ThemeProvider..."

Components need either:
1. A `ThemeProvider` ancestor in the component tree, OR
2. A `theme` prop passed directly

```tsx
// Option 1: Provider
<ThemeProvider theme={theme}>
  <ThemedText>Works!</ThemedText>
</ThemeProvider>

// Option 2: Direct prop
<ThemedText theme={theme}>Works!</ThemedText>
```

### Background Image Not Showing

Verify `background.image` is a `MediaReference` object:

```typescript
// Wrong (legacy format)
background: { image: 'https://...' }

// Correct (new format)
background: { image: { mediaAssetId: 'abc', url: 'https://...' } }
```

Legacy string URLs are auto-converted when parsed through the schema.

### Button Not Styled

Check that theme has button configuration:

```typescript
const theme = {
  primaryColor: '#3B82F6',
  button: {
    backgroundColor: null,  // Falls back to primaryColor
    textColor: '#FFFFFF',
    radius: 'rounded'
  }
}
```

## Next Steps

After this feature:
- `ThemedInput`, `ThemedTextArea` for form inputs
- Opinion scale and yes/no specialized inputs
- `ThemedCard` for content containers
