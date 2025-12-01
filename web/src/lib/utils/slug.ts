/**
 * Slug generation and validation utilities
 * Used for URL-friendly company identifiers
 */

const SLUG_LENGTH = { min: 1, max: 50 };
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

/**
 * Generate a URL-friendly slug from a name
 *
 * @param name - The name to convert to a slug
 * @returns URL-friendly slug (lowercase, alphanumeric with hyphens)
 *
 * @example
 * generateSlug("Acme Corp") // "acme-corp"
 * generateSlug("My  Company!") // "my-company"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, SLUG_LENGTH.max); // Enforce max length
}

/**
 * Validate if a string is a valid slug
 *
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 *
 * Rules:
 * - 1-50 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with a hyphen
 *
 * @example
 * isValidSlug("acme-corp") // true
 * isValidSlug("-invalid") // false
 * isValidSlug("UPPERCASE") // false
 */
export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_LENGTH.min &&
    slug.length <= SLUG_LENGTH.max &&
    SLUG_PATTERN.test(slug)
  );
}
