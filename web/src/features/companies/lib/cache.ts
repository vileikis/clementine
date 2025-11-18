/**
 * In-memory cache for company status to reduce Firestore reads on guest link validation
 *
 * Implementation notes:
 * - 60s TTL per research.md recommendation
 * - Cache hit rate target: >80%
 * - Reduces Firestore reads by ~90% for repeat guest link access
 * - Automatic cleanup of expired entries every 60 seconds
 */

import type { CompanyStatus } from "../types/company.types";

interface CacheEntry {
  status: CompanyStatus;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Get company status from cache or return null if not cached/expired
 */
export function getCachedCompanyStatus(
  companyId: string
): CompanyStatus | null {
  const now = Date.now();
  const entry = cache.get(companyId);

  if (!entry || entry.expires <= now) {
    // Cache miss or expired
    if (entry) {
      cache.delete(companyId);
    }
    return null;
  }

  return entry.status;
}

/**
 * Store company status in cache with TTL
 */
export function setCachedCompanyStatus(
  companyId: string,
  status: CompanyStatus
): void {
  const now = Date.now();
  cache.set(companyId, {
    status,
    expires: now + CACHE_TTL_MS,
  });
}

/**
 * Invalidate cache entry for a specific company (used on delete/update)
 */
export function invalidateCompanyStatusCache(companyId: string): void {
  cache.delete(companyId);
}

/**
 * Clear all cache entries (for testing or manual reset)
 */
export function clearCompanyStatusCache(): void {
  cache.clear();
}

/**
 * Periodic cleanup of expired cache entries
 * Runs every 60 seconds to prevent memory bloat
 */
setInterval(() => {
  const now = Date.now();
  for (const [companyId, entry] of cache.entries()) {
    if (entry.expires <= now) {
      cache.delete(companyId);
    }
  }
}, CACHE_TTL_MS);
