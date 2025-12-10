# Quickstart: Theming Module

**Feature Branch**: `023-theming-module`
**Created**: 2025-12-10

## Overview

This guide helps developers get started with the theming module quickly. It covers basic usage patterns and common integration scenarios.

## Installation

The theming module is part of the web application. No additional installation required.

```typescript
import { Theme, ThemeProvider, useTheme, ThemedBackground } from "@/features/theming";
```

## Basic Usage

### 1. Wrap Components with ThemeProvider

```tsx
import { ThemeProvider } from "@/features/theming";

function EventPreview({ event }: { event: Event }) {
  return (
    <ThemeProvider theme={event.theme}>
      <PreviewContent />
    </ThemeProvider>
  );
}
```

### 2. Access Theme in Child Components

```tsx
import { useTheme } from "@/features/theming";

function StyledButton({ children }: { children: React.ReactNode }) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useTheme();

  return (
    <button
      style={{
        backgroundColor: buttonBgColor,
        color: buttonTextColor,
        borderRadius: buttonRadius,
      }}
    >
      {children}
    </button>
  );
}
```

### 3. Use ThemedBackground for Containers

```tsx
import { ThemedBackground } from "@/features/theming";

function PageWrapper({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <ThemedBackground
      background={theme.background}
      fontFamily={theme.fontFamily}
      className="min-h-screen"
    >
      {children}
    </ThemedBackground>
  );
}
```

## Common Patterns

### Using Theme Text Styles

```tsx
function ThemedText({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <p
      style={{
        color: theme.text.color,
        textAlign: theme.text.alignment,
      }}
    >
      {children}
    </p>
  );
}
```

### Using Computed Styles Hook

```tsx
import { useThemedStyles } from "@/features/theming";

function CompletelyThemedSection() {
  const styles = useThemedStyles();

  return (
    <div style={styles.background}>
      <h1 style={styles.text}>Welcome</h1>
      <button style={styles.button}>Get Started</button>
    </div>
  );
}
```

### Using Button Radius Constant

```tsx
import { BUTTON_RADIUS_MAP } from "@/features/theming";

// When you need the CSS value directly
const mdRadius = BUTTON_RADIUS_MAP.md; // "0.5rem"
```

## Type Usage

### Defining Theme-Aware Props

```tsx
import type { Theme } from "@/features/theming";

interface ThemeEditorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}
```

### Using Sub-Types

```tsx
import type { ThemeBackground, ThemeButton } from "@/features/theming";

function BackgroundPicker({ value, onChange }: {
  value: ThemeBackground;
  onChange: (bg: ThemeBackground) => void;
}) {
  // ...
}
```

## Migration from EventThemeProvider

### Before

```tsx
import { EventThemeProvider, useEventTheme } from "@/components/providers/EventThemeProvider";
import type { EventTheme } from "@/features/events/types";

<EventThemeProvider theme={eventTheme}>
  <Child />
</EventThemeProvider>

// In child:
const { buttonBgColor } = useEventTheme();
```

### After

```tsx
import { ThemeProvider, useTheme } from "@/features/theming";
import type { Theme } from "@/features/theming";

<ThemeProvider theme={theme}>
  <Child />
</ThemeProvider>

// In child:
const { buttonBgColor } = useTheme();
```

## Error Handling

### Missing Provider Error

If you see this error:
```
Error: useTheme must be used within a ThemeProvider
```

Ensure your component is wrapped in a `ThemeProvider`:

```tsx
// Wrong
function App() {
  return <ThemedComponent />; // Error!
}

// Correct
function App() {
  return (
    <ThemeProvider theme={theme}>
      <ThemedComponent />
    </ThemeProvider>
  );
}
```

## File Structure Reference

```
web/src/features/theming/
├── index.ts                    # Public exports
├── types/
│   ├── index.ts
│   └── theme.types.ts          # Theme, ThemeText, ThemeButton, ThemeBackground
├── constants/
│   ├── index.ts
│   └── theme-defaults.ts       # BUTTON_RADIUS_MAP
├── components/
│   ├── index.ts
│   ├── ThemeProvider.tsx       # Context provider
│   └── ThemedBackground.tsx    # Background component
├── hooks/
│   ├── index.ts
│   ├── useTheme.ts             # Context hook
│   └── useThemedStyles.ts      # Computed styles hook
└── context/
    └── ThemeContext.tsx        # React context definition
```

## Next Steps

- See `data-model.md` for complete type definitions
- See `contracts/theming-api.md` for full API documentation
- See `spec.md` for acceptance criteria and edge cases
