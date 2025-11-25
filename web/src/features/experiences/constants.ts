/**
 * AI Model Configurations
 *
 * Defines available AI models for photo experiences.
 */

export const AI_MODELS = [
  { value: "nanobanana", label: "Nano Banana" },
  // Future models can be added here
] as const;

export const DEFAULT_AI_MODEL = "nanobanana";

/**
 * AI Model Prompt Guide URLs
 *
 * Maps AI model identifiers to their respective prompt guide documentation URLs.
 * Used to provide organizers with model-specific guidance when configuring AI transformations.
 *
 * @see specs/001-photo-experience-tweaks/research.md - Research Area 4: Prompt Guide Link Management
 */

export const AI_MODEL_PROMPT_GUIDES: Record<string, string> = {
  nanobanana: "https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide",
  // Future models can be added here as they become available
  // example: "https://docs.example.com/ai-model/prompting",
};
