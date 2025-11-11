// Authentication utility for ADMIN_SECRET verification
import { cookies } from "next/headers";

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

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return { authorized: false, error: "Invalid credentials" };
  }

  return { authorized: true };
}
