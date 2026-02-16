# Localization

## Problem

Guest-facing experiences contain hardcoded English text throughout renderers and components. Creators running events in non-English markets (e.g., Sweden, Finland, Norway) need copy in the local language. Events often need **multiple languages** — guests should be able to pick their preferred language (e.g., English + Swedish).

## Copy Categories

There are 3 distinct categories of guest-facing text:

### 1. Creator Copy (~15 fields)

Text authored by the experience creator per project/experience. Already stored in config schemas.

**Examples**: step titles, step descriptions/questions, welcome title, CTA labels, email capture heading, share ready title/description.

**Localization need**: Creator must author translations for each supported locale.

### 2. System UI Copy (~40 strings)

Platform-provided labels that appear in the guest experience. Currently hardcoded in components. Same across all experiences.

**Examples**: "Library", "Flip", "Retake", "Next", "Start over", "Yes", "No", "Take", "Continue", "Cancel", "Exit".

**Localization need**: Platform ships translations. No creator involvement.

### 3. System Messages (~60 strings)

Error states, loading messages, permission prompts. Not directly customizable by creators.

**Examples**: "Camera Access Needed", "Saving your photo...", "Camera Blocked", "Something went wrong", "Loading...".

**Localization need**: Platform ships translations. Lower priority — can remain English initially.

## Guest Flow

1. Guest lands on welcome screen
2. If project supports multiple locales, a language selector is shown
3. Guest picks locale — stored in session context
4. All renderers resolve copy based on selected locale
5. System strings auto-resolve; creator copy falls back to default locale if translation is missing

## Proposed Solution

### Schema Changes

Add to project config:

- `defaultLocale` — primary authoring language (e.g., `'en'`)
- `supportedLocales` — locales guests can pick from (e.g., `['en', 'sv']`)
- `translations` — overlay map of creator copy translations keyed by locale

Existing config fields remain unchanged and represent the default locale.

```ts
projectConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'sv'],

  // Existing fields (authored in defaultLocale, unchanged)
  welcome: { title: "Welcome to our event", ... },
  shareReady: { title: "Your photo is ready!", ... },

  // Translation overlay for non-default locales
  translations: {
    sv: {
      "welcome.title": "Välkommen till vårt event",
      "shareReady.title": "Din bild är klar!",
    }
  }
}
```

Experience-level creator copy follows the same pattern:

```ts
experience.draft.translations = {
  sv: {
    "<stepId>.config.title": "Ta en selfie",
  }
}
```

### System Strings

Ship i18n dictionaries in `packages/shared`:

```ts
// packages/shared/src/i18n/system-strings.ts
export const systemStrings = {
  en: { 'capture.library': 'Library', 'capture.flip': 'Flip', ... },
  sv: { 'capture.library': 'Bibliotek', 'capture.flip': 'Vänd', ... },
}
```

### Resolution Order

For any guest-facing string:

1. Creator translation for guest locale (`translations[locale][path]`)
2. System string for guest locale (`systemStrings[locale][key]`)
3. Default locale value (existing config field or English system string)

### Runtime

- `LocaleProvider` context wrapping the guest experience
- `useSystemString(key)` hook for system UI copy
- `useLocalizedCopy(path, defaultValue)` hook for creator copy
- Locale stored in session for analytics and server-side use

## Phasing

**Phase 1 — System UI localization**: Add locale config fields, ship system string dictionaries, add locale context + hooks, language selector on welcome screen, track locale in session. Solves immediate requests ("Flip", "Library" in local language).

**Phase 2 — Creator copy translations**: Add `translations` overlay to project config + experience schemas, build translations editor UI, add `useLocalizedCopy()` hook.
