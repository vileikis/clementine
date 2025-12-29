# Quickstart: Theming Module

**Feature**: 006-theming-migration
**Audience**: Developers building guest-facing experiences
**Time to Complete**: 5-10 minutes

## What You'll Learn

- How to wrap components with `ThemeProvider`
- How to access theme values with `useEventTheme()`
- How to apply theme styles with `useThemedStyles()`
- How to render themed backgrounds with `ThemedBackground`
- How to validate theme data with Zod schemas

---

## Prerequisites

- TanStack Start app running (`pnpm dev` from `apps/clementine-app/`)
- Basic understanding of React Context and hooks
- Theme data available (e.g., from Firestore)

---

## Step 1: Validate Theme Data

Before using theme data, validate it with the Zod schema to ensure type safety:

```typescript
import { themeSchema } from '@/shared/theming';

async function fetchEventTheme(eventId: string) {
  const doc = await firestore.collection('events').doc(eventId).get();
  const rawTheme = doc.data()?.theme;

  // Validate theme data at runtime
  try {
    const validatedTheme = themeSchema.parse(rawTheme);
    return validatedTheme;
  } catch (error) {
    console.error('Invalid theme data:', error);
    throw new Error('Event theme validation failed');
  }
}
```

**Why validate?** Theme data from Firestore may be malformed or outdated. Runtime validation prevents errors in guest-facing experiences.

---

## Step 2: Wrap Your Experience with ThemeProvider

The `ThemeProvider` component makes theme values available to all descendant components via React Context:

```typescript
'use client';

import { ThemeProvider } from '@/shared/theming';

export function EventExperience({ event }) {
  return (
    <ThemeProvider theme={event.theme}>
      <EventContent />
    </ThemeProvider>
  );
}
```

**Important**: Add `'use client'` directive at the top of files using `ThemeProvider` (React Context requires client-side rendering).

---

## Step 3: Access Theme Values with useEventTheme()

Inside any component within `ThemeProvider`, use the `useEventTheme()` hook to access theme values:

```typescript
'use client';

import { useEventTheme } from '@/shared/theming';

function ThemedButton() {
  const { theme, buttonBgColor, buttonTextColor, buttonRadius } = useEventTheme();

  return (
    <button
      style={{
        backgroundColor: buttonBgColor,
        color: buttonTextColor,
        borderRadius: buttonRadius,
        padding: '0.75rem 1.5rem',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Upload Photo
    </button>
  );
}
```

**What you get**:
- `theme`: Raw theme object (Theme type)
- `buttonBgColor`: Computed button background (falls back to primaryColor if null)
- `buttonTextColor`: Button text color
- `buttonRadius`: CSS border-radius value (mapped from preset)

---

## Step 4: Apply Styles with useThemedStyles()

For convenience, use `useThemedStyles()` to get pre-computed CSS style objects:

```typescript
'use client';

import { useThemedStyles } from '@/shared/theming';

function ThemedSection() {
  const styles = useThemedStyles();

  return (
    <div style={styles.background}>
      <h1 style={styles.text}>Welcome to the Event</h1>
      <p style={styles.text}>Upload your photo to get started</p>
      <button style={styles.button}>Get Started</button>
    </div>
  );
}
```

**What you get**:
- `styles.text`: Text color and alignment
- `styles.button`: Button background, text color, and border radius
- `styles.background`: Background color, image (if present), and font family (if present)

---

## Step 5: Render Full-Page Themed Background

Use `ThemedBackground` component for full-page themed experiences:

```typescript
import { ThemedBackground } from '@/shared/theming';

function UploadPage({ theme }) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
    >
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Upload Your Photo</h1>
        <p className="text-lg">Transform your photo with AI</p>
        <button>Choose File</button>
      </div>
    </ThemedBackground>
  );
}
```

**Features**:
- Full-height container (fills available space)
- Background color (always visible)
- Optional background image with overlay
- Centered content with max-width (customizable)
- Font family applied to container

---

## Complete Example: Themed Event Experience

Here's a complete example combining all concepts:

```typescript
'use client';

import { ThemeProvider, ThemedBackground, useThemedStyles } from '@/shared/theming';
import type { Theme } from '@/shared/theming';

// Parent component (wraps with provider)
export function EventExperience({ event }: { event: { theme: Theme } }) {
  return (
    <ThemeProvider theme={event.theme}>
      <ThemedBackground
        background={event.theme.background}
        fontFamily={event.theme.fontFamily}
      >
        <EventContent />
      </ThemedBackground>
    </ThemeProvider>
  );
}

// Child component (consumes theme via hook)
function EventContent() {
  const styles = useThemedStyles();

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 style={styles.text} className="text-5xl font-bold mb-4">
          Holiday Party 2025
        </h1>
        <p style={styles.text} className="text-xl">
          Upload your photo and get an AI-transformed memory
        </p>
      </header>

      <div className="flex flex-col items-center gap-4">
        <button
          style={styles.button}
          className="px-8 py-4 text-lg font-semibold"
        >
          Upload Photo
        </button>
        <button
          style={{
            ...styles.button,
            backgroundColor: 'transparent',
            border: `2px solid ${styles.button.backgroundColor}`,
          }}
          className="px-8 py-4 text-lg font-semibold"
        >
          View Gallery
        </button>
      </div>
    </div>
  );
}
```

---

## Common Patterns

### Pattern: Conditional Theming

Apply theme values conditionally based on component state:

```typescript
function ThemedCard({ isSelected }) {
  const { buttonBgColor, theme } = useEventTheme();

  return (
    <div
      style={{
        backgroundColor: isSelected ? buttonBgColor : 'white',
        color: isSelected ? theme.button.textColor : theme.text.color,
        padding: '1rem',
        borderRadius: '0.5rem',
      }}
    >
      Card Content
    </div>
  );
}
```

---

### Pattern: Mixing Tailwind and Theme Styles

Combine Tailwind utility classes with inline theme styles:

```typescript
function ThemedButton() {
  const styles = useThemedStyles();

  return (
    <button
      style={styles.button}
      className="px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow"
    >
      Click Me
    </button>
  );
}
```

---

### Pattern: Custom Content Layout in ThemedBackground

Override the default centered content wrapper:

```typescript
// Full-width layout
<ThemedBackground
  background={theme.background}
  contentClassName="p-0" // No padding, full width
>
  <FullWidthGallery />
</ThemedBackground>

// Custom padding
<ThemedBackground
  background={theme.background}
  contentClassName="px-8 py-12"
>
  <CustomLayout />
</ThemedBackground>

// No content wrapper (manual layout)
<ThemedBackground
  background={theme.background}
  contentClassName="" // Empty string disables wrapper
>
  <CustomFlexLayout />
</ThemedBackground>
```

---

## Troubleshooting

### Error: "useEventTheme must be used within a ThemeProvider"

**Cause**: You're using `useEventTheme()` or `useThemedStyles()` outside a `ThemeProvider`.

**Solution**: Wrap your component tree with `ThemeProvider`:

```typescript
// ❌ Wrong
function MyComponent() {
  const theme = useEventTheme(); // Error!
  return <div>...</div>;
}

// ✅ Correct
function MyApp({ theme }) {
  return (
    <ThemeProvider theme={theme}>
      <MyComponent /> {/* Now useEventTheme() works */}
    </ThemeProvider>
  );
}
```

---

### Error: Zod validation fails

**Cause**: Theme data from Firestore is invalid or malformed.

**Solution**: Check validation error messages and fix theme data:

```typescript
try {
  const validatedTheme = themeSchema.parse(rawTheme);
} catch (error) {
  console.error('Validation error:', error);
  // Example error: "Invalid hex color format" for primaryColor
  // Fix: Ensure all colors are in #RRGGBB format
}
```

**Common issues**:
- Color not in hex format (use `#FF5733`, not `red`)
- Invalid alignment value (use `left`, `center`, or `right`)
- Overlay opacity out of range (use 0-1, not 0-100)

---

### Issue: Background image not loading

**Cause**: Image URL is invalid or image fails to load from server.

**Solution**: Browser automatically falls back to background color. Verify image URL:

```typescript
// Verify image URL in theme
console.log('Background image:', theme.background.image);

// Test image loading
const img = new Image();
img.onload = () => console.log('Image loaded successfully');
img.onerror = () => console.error('Image failed to load');
img.src = theme.background.image;
```

---

### Issue: Theme changes not reflected

**Cause**: React Context doesn't trigger re-render when theme prop reference doesn't change.

**Solution**: Ensure theme object reference changes when data updates:

```typescript
// ❌ Wrong (mutating theme object)
theme.primaryColor = '#FF5733';

// ✅ Correct (new object reference)
const updatedTheme = { ...theme, primaryColor: '#FF5733' };
```

---

## Next Steps

- **Read the Data Model**: See `data-model.md` for complete type definitions
- **Review Public API**: See `contracts/public-api.md` for all exports
- **Write Tests**: See constitution Principle IV for testing guidelines
- **Build Features**: Use theming in your domain features (events, experiences, projects)

---

## Getting Help

- **Check existing code**: Look for theming usage in other components
- **Review standards**: See `standards/frontend/component-libraries.md`
- **Ask the team**: When in doubt, discuss with the team

---

## References

- Feature Specification: `spec.md`
- Data Model: `data-model.md`
- Public API Contract: `contracts/public-api.md`
- Implementation: `apps/clementine-app/src/shared/theming/`
