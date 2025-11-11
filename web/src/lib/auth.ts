// Authentication utility for ADMIN_SECRET verification
import { cookies } from "next/headers";

/**
 * Verify if a given secret matches the ADMIN_SECRET environment variable
 *
 * @param secret - The secret to verify
 * @returns true if valid, false otherwise
 */
export function isValidAdminSecret(secret: string | undefined): boolean {
  if (!secret) {
    return false;
  }

  if (!process.env.ADMIN_SECRET) {
    console.error("ADMIN_SECRET environment variable is not set");
    return false;
  }

  return secret === process.env.ADMIN_SECRET;
}

/**
 * Verify admin authentication via ADMIN_SECRET cookie
 *
 * @returns Authorization result with status and optional error message
 *
 * @example
 * ```typescript
 * const auth = await verifyAdminSecret();
 * if (!auth.authorized) {
 *   return { success: false, error: auth.error };
 * }
 * // ... proceed with authenticated action
 * ```
 */
export async function verifyAdminSecret(): Promise<
  | { authorized: true }
  | { authorized: false; error: string }
> {
  const cookieStore = await cookies();
  const adminSecret = cookieStore.get("ADMIN_SECRET")?.value;

  if (!adminSecret) {
    return { authorized: false, error: "Authentication required" };
  }

  if (!isValidAdminSecret(adminSecret)) {
    return { authorized: false, error: "Invalid credentials" };
  }

  return { authorized: true };
}
