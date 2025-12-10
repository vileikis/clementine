# Theming Module API Contract

**Feature Branch**: `023-theming-module`
**Created**: 2025-12-10

## Overview

This document defines the public API contract for the theming module. The module is **client-side only** and exposes React components, hooks, types, and constants. There are no REST endpoints or server-side APIs.

## Module Public API

### Exports from `@/features/theming`

```typescript
// Types
export type { Theme, ThemeText, ThemeButton, ThemeBackground } from "./types";
export type { ThemeContextValue } from "./context/ThemeContext";
export type { ButtonRadius } from "./types";

// Constants
export { BUTTON_RADIUS_MAP } from "./constants";

// Components
export { ThemeProvider } from "./components/ThemeProvider";
export { ThemedBackground } from "./components/ThemedBackground";

// Hooks
export { useTheme } from "./hooks/useTheme";
export { useThemedStyles } from "./hooks/useThemedStyles";
```

## Component Contracts

### ThemeProvider

Provides theme context to descendant components.

**Props**:
```typescript
interface ThemeProviderProps {
  theme: Theme;      // Required: The theme configuration
  children: ReactNode; // Required: Child components
}
```

**Behavior**:
- Creates `ThemeContextValue` with computed conveniences
- `buttonBgColor`: Falls back to `theme.primaryColor` if `theme.button.backgroundColor` is null
- `buttonRadius`: Mapped from `theme.button.radius` using `BUTTON_RADIUS_MAP`
- Memoized to prevent unnecessary re-renders

**Example**:
```tsx
<ThemeProvider theme={event.theme}>
  <MyThemedComponent />
</ThemeProvider>
```

### ThemedBackground

Renders a container with background color, optional image, and optional overlay.

**Props**:
```typescript
interface ThemedBackgroundProps {
  children: ReactNode;                    // Required: Content to render
  background?: Partial<ThemeBackground>;  // Optional: Background config
  fontFamily?: string | null;             // Optional: CSS font-family
  className?: string;                     // Optional: Additional CSS classes
}
```

**Behavior**:
- Renders background color (defaults to `#FFFFFF` if not provided)
- If `background.image` is provided, renders as cover/center background
- If `background.image` and `overlayOpacity > 0`, renders semi-transparent black overlay
- Content is rendered in a `relative z-10` container above background layers

**Example**:
```tsx
<ThemedBackground
  background={theme.background}
  fontFamily={theme.fontFamily}
  className="min-h-screen"
>
  <PageContent />
</ThemedBackground>
```

## Hook Contracts

### useTheme

Access theme context values.

**Signature**:
```typescript
function useTheme(): ThemeContextValue
```

**Returns**:
```typescript
{
  theme: Theme;           // The raw theme object
  buttonBgColor: string;  // Resolved button background color
  buttonTextColor: string; // Button text color
  buttonRadius: string;   // CSS border-radius value
}
```

**Error Handling**:
- Throws `Error("useTheme must be used within a ThemeProvider")` if called outside provider

**Example**:
```tsx
function ActionButton({ children }) {
  const { buttonBgColor, buttonTextColor, buttonRadius } = useTheme();

  return (
    <button style={{
      backgroundColor: buttonBgColor,
      color: buttonTextColor,
      borderRadius: buttonRadius,
    }}>
      {children}
    </button>
  );
}
```

### useThemedStyles

Compute inline style objects from theme values.

**Signature**:
```typescript
function useThemedStyles(): ThemedStyles
```

**Returns**:
```typescript
interface ThemedStyles {
  text: React.CSSProperties;       // { color, textAlign }
  button: React.CSSProperties;     // { backgroundColor, color, borderRadius }
  background: React.CSSProperties; // { backgroundColor, backgroundImage?, fontFamily? }
}
```

**Dependencies**: Must be called within a `ThemeProvider`

**Example**:
```tsx
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

## Type Contracts

### Theme

```typescript
interface Theme {
  primaryColor: string;           // Hex color (#RRGGBB)
  fontFamily?: string | null;     // CSS font-family string
  text: ThemeText;
  button: ThemeButton;
  background: ThemeBackground;
}
```

### ThemeText

```typescript
interface ThemeText {
  color: string;                  // Hex color (#RRGGBB)
  alignment: "left" | "center" | "right";
}
```

### ThemeButton

```typescript
interface ThemeButton {
  backgroundColor?: string | null; // Hex color, falls back to primaryColor
  textColor: string;              // Hex color (#RRGGBB)
  radius: "none" | "sm" | "md" | "full";
}
```

### ThemeBackground

```typescript
interface ThemeBackground {
  color: string;                  // Hex color (#RRGGBB)
  image?: string | null;          // Full public URL
  overlayOpacity: number;         // 0-1
}
```

### ButtonRadius

```typescript
type ButtonRadius = "none" | "sm" | "md" | "full";
```

## Constant Contracts

### BUTTON_RADIUS_MAP

```typescript
const BUTTON_RADIUS_MAP: Record<ButtonRadius, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  full: "9999px",
};
```

## Migration Compatibility

During migration, consuming modules can create type aliases:

```typescript
// Temporary backward compatibility
export type { Theme as ProjectTheme } from "@/features/theming";
export type { Theme as EventTheme } from "@/features/theming";
```

## Versioning

This is version 1.0.0 of the theming module API. Breaking changes will follow semver:
- **MAJOR**: Removing exports, changing type shapes, changing hook behavior
- **MINOR**: Adding new exports, adding optional props
- **PATCH**: Bug fixes, documentation updates
