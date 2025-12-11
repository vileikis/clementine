// Guest module public API

// Components
export { BrandThemeProvider } from "./components/BrandThemeProvider"
export {
  LoadingScreen,
  NoActiveEvent,
  EmptyEvent,
  ExperienceScreen,
  WelcomeContent,
  ExperienceCards,
  ExperienceCard,
} from "./components"

// Types
export type {
  Guest,
  Session,
  SessionState,
  GuestAuthState,
} from "./types"

// Schemas
export {
  sessionStateSchema,
  guestSchema,
  createGuestSchema,
  sessionSchema,
  createSessionSchema,
} from "./schemas"
export type {
  CreateGuestInput,
  CreateSessionInput,
} from "./schemas"

// Actions
export {
  createGuestAction,
  createSessionAction,
  getSessionAction,
  validateSessionOwnershipAction,
} from "./actions"
export type { ActionResponse } from "./actions"

// Hooks
export { useGuestAuth, useSession } from "./hooks"

// Contexts
export { GuestProvider, useGuestContext } from "./contexts"
