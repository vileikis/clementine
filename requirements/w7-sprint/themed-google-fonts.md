## Theming with Google Fonts

### Goal

Project Theme Editor lets you choose **Google Fonts** (not just system fonts). Theme fonts apply cleanly to **guest experience** (via your existing `ThemedBackground`).

### UX requirements (Theme Editor)

- Font picker with:
  - Search
  - Preview sentence (“Clementine makes sharing magical.”)
  - Weights/variants selection (at least regular + bold)

- “Apply to” scope:
  - Base text
  - Headings (optional if you want v1 simple: single font for all)

**Don’t ship a picker that lets users select a font you don’t actually load.** That’s the #1 way this becomes flaky.

### Theme data model (minimum)

Store in Project Theme:

- `fontFamily`: string (e.g., `"Inter"`)
- `fontSource`: `"google"` | `"system"`
- `fontVariants`: array (e.g., `[400, 600, 700]`) and optionally italics
- `fallbackStack`: string (e.g., `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`)

### Loading strategy (you need to pick one)

**Recommended for Next.js:** use built-in font optimization (e.g., `next/font/google`) if you can.

- Pros: optimized loading, avoids FOIT, subsets, caching.
- Cons: dynamic per-project fonts can be tricky (because `next/font` is build-time friendly).

If fonts are truly dynamic per project at runtime:

- Use a runtime loader:
  - Inject `<link rel="preconnect" ...>` + `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">`
  - Set `display=swap`

- Cache the constructed URL per theme to avoid re-injecting on each route change.

### Guest application (ThemedBackground)

- Set CSS variables at the highest wrapper level:
  - `--font-family-base`

- Apply globally within guest shell:
  - `font-family: var(--font-family-base), var(--font-fallback);`

### Graceful behavior requirements

- If Google Fonts fails (network/CSP):
  - fallback stack is used automatically
  - no broken layout shifts beyond normal font swap

- Avoid ugly flash:
  - always use `display=swap`
  - optionally preload the stylesheet URL when entering guest flow

### Acceptance criteria

- Theme editor saves font selection and preview updates immediately.
- Guest experience uses selected font on:
  - headings, body, buttons, form labels (everything)

- If font can’t load, fallback is readable and consistent.

### Edge cases you must not ignore

- Some fonts lack weights → clamp weights to available variants.
- Multiple experiences in same project share theme → consistent.
- If you allow per-experience overrides later, make sure precedence is clear (Project default < Experience override).
