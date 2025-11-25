/**
 * AI Model Configurations
 *
 * Defines available AI models for photo experiences.
 * Uses Google Gemini image generation models.
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */

export const AI_MODELS = [
  { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash" },
  { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro (Preview)" },
] as const;

export const DEFAULT_AI_MODEL = "gemini-2.5-flash-image";

/**
 * AI Model Prompt Guide URLs
 *
 * Maps AI model identifiers to their respective prompt guide documentation URLs.
 * Used to provide organizers with model-specific guidance when configuring AI transformations.
 */

export const AI_MODEL_PROMPT_GUIDES: Record<string, string> = {
  "gemini-2.5-flash-image": "https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide",
  "gemini-3-pro-image-preview": "https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide",
};
