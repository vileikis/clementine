# Public API Contract: Theming Module

**Feature**: 006-theming-migration
**Date**: 2025-12-29
**Module**: `@/shared/theming`

## Overview

This document defines the public API contract for the theming module. All exports are available via the barrel export at `@/shared/theming`.

**Stability**: This is a shared infrastructure module. Breaking changes to this API affect all domains.

---

## Exported Types

### Core Types

#### `Theme`
```typescript
interface Theme {
  primaryColor: string;
  fontFamily?: string | null;
  text: ThemeText;
  button: ThemeButton;
  background: ThemeBackground;
}
```

**Purpose**: Complete theme configuration for an event or project.

**Usage**:
```typescript
import type { Theme } from '@/shared/theming';

const eventTheme: Theme = {
  primaryColor: '#FF5733',
  fontFamily: 'Inter, sans-serif',
  text: { color: '#000000', alignment: 'center' },
  button: { backgroundColor: null, textColor: '#FFFFFF', radius: 'md' },
  background: { color: '#F0F0F0', image: null, overlayOpacity: 0 },
};
```

---

#### `ThemeText`
```typescript
interface ThemeText {
  color: string;
  alignment: "left" | "center" | "right";
}
```

**Purpose**: Text styling configuration.

**Usage**:
```typescript
import type { ThemeText } from '@/shared/theming';

const textConfig: ThemeText = {
  color: '#000000',
  alignment: 'center',
};
```

---

#### `ThemeButton`
```typescript
interface ThemeButton {
  backgroundColor?: string | null;
  textColor: string;
  radius: ButtonRadius;
}
```

**Purpose**: Button styling configuration.

**Usage**:
```typescript
import type { ThemeButton } from '@/shared/theming';

const buttonConfig: ThemeButton = {
  backgroundColor: '#FF5733', // or null to fallback to primaryColor
  textColor: '#FFFFFF',
  radius: 'md',
};
```

---

#### `ThemeBackground`
```typescript
interface ThemeBackground {
  color: string;
  image?: string | null;
  overlayOpacity: number;
}
```

**Purpose**: Background styling configuration.

**Usage**:
```typescript
import type { ThemeBackground } from '@/shared/theming';

const backgroundConfig: ThemeBackground = {
  color: '#F0F0F0',
  image: 'https://storage.googleapis.com/...',
  overlayOpacity: 0.5,
};
```

---

#### `ButtonRadius`
```typescript
type ButtonRadius = "none" | "sm" | "md" | "full";
```

**Purpose**: Button border radius preset.

**Usage**:
```typescript
import type { ButtonRadius } from '@/shared/theming';

const radius: ButtonRadius = 'md';
```

---

#### `ThemeContextValue`
```typescript
interface ThemeContextValue {
  theme: Theme;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonRadius: string;
}
```

**Purpose**: Value provided by `ThemeProvider` context (includes computed values).

**Usage**: Returned by `useEventTheme()` hook. Not typically used directly.

---

## Exported Components

### `ThemeProvider`

**Signature**:
```typescript
function ThemeProvider(props: {
  theme: Theme;
  children: ReactNode;
}): JSX.Element;
```

**Purpose**: Provides theme context to all descendant components.

**Usage**:
```typescript
import { ThemeProvider } from '@/shared/theming';

function EventExperience({ event }) {
  return (
    <ThemeProvider theme={event.theme}>
      <EventContent />
    </ThemeProvider>
  );
}
```

**Behavior**:
- Computes derived values (buttonBgColor, buttonRadius)
- Memoizes computed values for performance
- Provides values via React Context

**Requirements**:
- Must have "use client" in consuming files (React Context limitation)
- `theme` prop must be validated with `themeSchema` before passing

---

### `ThemedBackground`

**Signature**:
```typescript
function ThemedBackground(props: {
  children: ReactNode;
  background?: Partial<ThemeBackground>;
  fontFamily?: string | null;
  className?: string;
  style?: CSSProperties;
  contentClassName?: string;
}): JSX.Element;
```

**Purpose**: Renders a full-height container with themed background and centered content.

**Usage**:
```typescript
import { ThemedBackground } from '@/shared/theming';

function ExperiencePage({ theme }) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
    >
      <PageContent />
    </ThemedBackground>
  );
}
```

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Content to render above background |
| `background` | `Partial<ThemeBackground>` | No | `{}` | Background configuration |
| `fontFamily` | `string \| null` | No | `null` | CSS font-family for container |
| `className` | `string` | No | `""` | Additional classes for outer container |
| `style` | `CSSProperties` | No | `{}` | Additional inline styles for outer container |
| `contentClassName` | `string` | No | Default wrapper classes | Override classes for content wrapper. Pass `""` to disable wrapper. |

**Behavior**:
- Renders full-height container (`flex-1`)
- Applies background color (always visible)
- Renders background image if provided
- Renders overlay if `overlayOpacity > 0`
- Centers content by default (customizable via `contentClassName`)

**Examples**:
```typescript
// Standard usage - centered content with max-width
<ThemedBackground background={theme.background}>
  <PageContent />
</ThemedBackground>

// Custom content layout
<ThemedBackground contentClassName="p-4">
  <FullWidthContent />
</ThemedBackground>

// No content wrapper
<ThemedBackground contentClassName="">
  <CustomLayout />
</ThemedBackground>
```

---

## Exported Hooks

### `useEventTheme()`

**Signature**:
```typescript
function useEventTheme(): ThemeContextValue;
```

**Purpose**: Access theme context values from nearest `ThemeProvider`.

**Usage**:
```typescript
import { useEventTheme } from '@/shared/theming';

function ThemedComponent() {
  const { theme, buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  return (
    <button style={{
      backgroundColor: buttonBgColor,
      color: buttonTextColor,
      borderRadius: buttonRadius
    }}>
      Themed Button
    </button>
  );
}
```

**Returns**: `ThemeContextValue` with theme and computed values.

**Throws**: Error if used outside `ThemeProvider`.

**Error Message**: `"useEventTheme must be used within a ThemeProvider"`

**Requirements**:
- Must have "use client" directive in consuming file
- Must be used within `ThemeProvider` component tree

---

### `useThemedStyles()`

**Signature**:
```typescript
function useThemedStyles(): ThemedStyles;

interface ThemedStyles {
  text: CSSProperties;
  button: CSSProperties;
  background: CSSProperties;
}
```

**Purpose**: Computes inline CSS style objects from theme values.

**Usage**:
```typescript
import { useThemedStyles } from '@/shared/theming';

function ThemedSection() {
  const styles = useThemedStyles();

  return (
    <div style={styles.background}>
      <p style={styles.text}>Styled text</p>
      <button style={styles.button}>Styled button</button>
    </div>
  );
}
```

**Returns**:
```typescript
{
  text: {
    color: string;
    textAlign: 'left' | 'center' | 'right';
  },
  button: {
    backgroundColor: string;
    color: string;
    borderRadius: string;
  },
  background: {
    backgroundColor: string;
    backgroundImage?: string;  // if theme.background.image present
    backgroundSize?: string;   // if image present
    backgroundPosition?: string; // if image present
    fontFamily?: string;       // if theme.fontFamily present
  }
}
```

**Behavior**:
- Uses `useEventTheme()` internally (must be within `ThemeProvider`)
- Memoizes style objects for performance
- Converts theme values to CSS properties

**Requirements**:
- Must have "use client" directive in consuming file
- Must be used within `ThemeProvider` component tree

---

## Exported Schemas (Zod)

### `themeSchema`

**Type**: `z.ZodObject<...>`

**Purpose**: Runtime validation for complete Theme objects.

**Usage**:
```typescript
import { themeSchema } from '@/shared/theming';

// Validate theme data from Firestore
try {
  const validatedTheme = themeSchema.parse(firestoreThemeData);
  // Use validatedTheme safely
} catch (error) {
  // Handle validation error
  console.error('Invalid theme data:', error);
}
```

**Validates**:
- All required fields present
- Hex color format for all color fields
- Valid alignment enum
- Valid radius preset enum
- Opacity range [0, 1]
- Valid URL format for background image (if present)

---

### `updateThemeSchema`

**Type**: `z.ZodObject<...>`

**Purpose**: Runtime validation for partial Theme updates (all fields optional).

**Usage**:
```typescript
import { updateThemeSchema } from '@/shared/theming';

// Validate partial theme update
const partialUpdate = updateThemeSchema.parse({
  text: { color: '#000000' }
});
```

**Validates**:
- Only provided fields are validated
- Missing fields are allowed (all optional)
- Same validation rules as `themeSchema` for provided fields

---

### `themeTextSchema`

**Type**: `z.ZodObject<...>`

**Purpose**: Runtime validation for `ThemeText` objects.

**Usage**:
```typescript
import { themeTextSchema } from '@/shared/theming';

const validatedText = themeTextSchema.parse({
  color: '#000000',
  alignment: 'center',
});
```

---

### `themeButtonSchema`

**Type**: `z.ZodObject<...>`

**Purpose**: Runtime validation for `ThemeButton` objects.

**Usage**:
```typescript
import { themeButtonSchema } from '@/shared/theming';

const validatedButton = themeButtonSchema.parse({
  backgroundColor: null,
  textColor: '#FFFFFF',
  radius: 'md',
});
```

---

### `themeBackgroundSchema`

**Type**: `z.ZodObject<...>`

**Purpose**: Runtime validation for `ThemeBackground` objects.

**Usage**:
```typescript
import { themeBackgroundSchema } from '@/shared/theming';

const validatedBackground = themeBackgroundSchema.parse({
  color: '#F0F0F0',
  image: 'https://storage.googleapis.com/...',
  overlayOpacity: 0.5,
});
```

---

### `COLOR_REGEX`

**Type**: `RegExp`

**Value**: `/^#[0-9A-Fa-f]{6}$/`

**Purpose**: Regex pattern for hex color validation.

**Usage**:
```typescript
import { COLOR_REGEX } from '@/shared/theming';

const isValidColor = COLOR_REGEX.test('#FF5733'); // true
const isInvalidColor = COLOR_REGEX.test('red'); // false
```

---

## Exported Constants

### `BUTTON_RADIUS_MAP`

**Type**: `Record<ButtonRadius, string>`

**Value**:
```typescript
{
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  full: "9999px",
}
```

**Purpose**: Maps button radius presets to CSS border-radius values.

**Usage**:
```typescript
import { BUTTON_RADIUS_MAP } from '@/shared/theming';

const cssRadius = BUTTON_RADIUS_MAP['md']; // "0.375rem"
```

---

## Usage Patterns

### Pattern 1: Basic Theme Provider

```typescript
import { ThemeProvider } from '@/shared/theming';

function EventExperience({ event }) {
  return (
    <ThemeProvider theme={event.theme}>
      <EventContent />
    </ThemeProvider>
  );
}
```

---

### Pattern 2: Accessing Theme Values

```typescript
'use client';

import { useEventTheme } from '@/shared/theming';

function ThemedButton() {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  return (
    <button style={{
      backgroundColor: buttonBgColor,
      color: buttonTextColor,
      borderRadius: buttonRadius,
    }}>
      Click Me
    </button>
  );
}
```

---

### Pattern 3: Using Style Utilities

```typescript
'use client';

import { useThemedStyles } from '@/shared/theming';

function ThemedSection() {
  const styles = useThemedStyles();

  return (
    <div style={styles.background}>
      <h1 style={styles.text}>Welcome</h1>
      <button style={styles.button}>Get Started</button>
    </div>
  );
}
```

---

### Pattern 4: Full-Page Themed Background

```typescript
import { ThemedBackground } from '@/shared/theming';

function ExperiencePage({ theme }) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
    >
      <div className="space-y-4">
        <h1>Event Experience</h1>
        <p>Upload your photo</p>
      </div>
    </ThemedBackground>
  );
}
```

---

### Pattern 5: Validating Theme Data

```typescript
import { themeSchema } from '@/shared/theming';

async function fetchEventTheme(eventId: string) {
  const doc = await firestore.collection('events').doc(eventId).get();
  const theme = doc.data()?.theme;

  // Validate theme data at runtime
  return themeSchema.parse(theme);
}
```

---

## Breaking Changes Policy

**This is a shared infrastructure module.** Changes to this public API affect all domains.

**Before making breaking changes:**
1. Audit all consumers across codebase
2. Create migration guide
3. Discuss with team
4. Consider deprecation period

**Examples of breaking changes:**
- Removing exported types, components, hooks, schemas, or constants
- Renaming exports
- Changing function signatures
- Changing validation rules (stricter validation)

**Non-breaking changes:**
- Adding new exports
- Adding optional props to components
- Adding optional fields to types (with defaults)
- Relaxing validation rules

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-29 | Initial migration from Next.js to TanStack Start |

---

## References

- Data Model: `data-model.md`
- Implementation: `apps/clementine-app/src/shared/theming/`
- Feature Specification: `spec.md`
