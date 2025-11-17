/**
 * Generic result type for Server Actions
 * Enforces Constitution Principle III (Type-Safe Development)
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
