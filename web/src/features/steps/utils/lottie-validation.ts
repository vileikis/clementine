/**
 * Minimum required fields for a valid Lottie JSON
 */
export interface LottieJSON {
  v: string; // Version
  fr: number; // Frame rate
  ip: number; // In point (start frame)
  op: number; // Out point (end frame)
  w: number; // Width
  h: number; // Height
  layers: unknown[]; // Animation layers
}

/**
 * Check if a parsed JSON object is a valid Lottie structure
 *
 * @param json - Parsed JSON object
 * @returns Type guard for LottieJSON
 */
export function isValidLottie(json: unknown): json is LottieJSON {
  if (typeof json !== "object" || json === null) return false;
  const obj = json as Record<string, unknown>;
  return (
    typeof obj.v === "string" &&
    typeof obj.fr === "number" &&
    typeof obj.ip === "number" &&
    typeof obj.op === "number" &&
    typeof obj.w === "number" &&
    typeof obj.h === "number" &&
    Array.isArray(obj.layers)
  );
}

/**
 * Validate a file as valid Lottie JSON
 *
 * @param file - JSON file to validate
 * @returns true if valid Lottie format
 */
export async function validateLottieFile(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    return isValidLottie(json);
  } catch {
    return false;
  }
}
