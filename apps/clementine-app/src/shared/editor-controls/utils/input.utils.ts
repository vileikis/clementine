/**
 * Get Tailwind color class for character counter based on usage ratio
 *
 * @param current - Current character count
 * @param max - Maximum allowed characters
 * @returns Tailwind text color class
 *
 * @example
 * getCounterColorClass(50, 100)  // 'text-muted-foreground' (under 80%)
 * getCounterColorClass(85, 100)  // 'text-amber-500' (80-99%)
 * getCounterColorClass(100, 100) // 'text-destructive' (at/over limit)
 */
export function getCounterColorClass(current: number, max: number): string {
  const ratio = current / max
  if (ratio >= 1) return 'text-destructive'
  if (ratio >= 0.8) return 'text-amber-500'
  return 'text-muted-foreground'
}
