// Event-related TypeScript types

export type EventStatus = "draft" | "live" | "archived";

/**
 * Event-wide theme settings for visual customization
 */
export interface EventTheme {
  buttonColor?: string | null; // Hex color (e.g., "#3B82F6")
  buttonTextColor?: string | null; // Hex color (e.g., "#FFFFFF")
  backgroundColor?: string | null; // Hex color (e.g., "#F9FAFB")
  backgroundImage?: string | null; // Full public URL
}

export interface Event {
  id: string;
  title: string;

  status: EventStatus;

  companyId: string | null; // FK to companies collection

  joinPath: string; // e.g., "/join/abc123"
  qrPngPath: string; // Storage path

  publishStartAt?: number | null; // Optional Unix timestamp ms
  publishEndAt?: number | null; // Optional Unix timestamp ms

  // Nested object configurations
  theme?: EventTheme | null;

  // Denormalized counters (for performance)
  experiencesCount: number;
  sessionsCount: number;
  readyCount: number; // Sessions in "ready" state
  sharesCount: number;

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}
