// Step feature constants

import type { ShareSocial, StepType } from "./types";

/**
 * Step-related limits and defaults
 */
export const STEP_CONSTANTS = {
  // Limits
  MAX_STEPS_PER_JOURNEY: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CTA_LABEL_LENGTH: 50,
  MAX_VARIABLE_NAME_LENGTH: 50,

  // Multiple Choice
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_OPTION_LABEL_LENGTH: 100,
  MAX_OPTION_VALUE_LENGTH: 50,

  // Text Input
  DEFAULT_SHORT_TEXT_MAX_LENGTH: 500,
  DEFAULT_LONG_TEXT_MAX_LENGTH: 2000,
  MAX_SHORT_TEXT_LENGTH: 1000,
  MAX_LONG_TEXT_LENGTH: 5000,

  // Opinion Scale
  MIN_SCALE_VALUE: 0,
  MAX_SCALE_VALUE: 10,

  // Processing
  MIN_PROCESSING_MESSAGES: 1,
  MAX_PROCESSING_MESSAGES: 10,
  MAX_PROCESSING_MESSAGE_LENGTH: 200,
  MIN_ESTIMATED_DURATION: 5,
  MAX_ESTIMATED_DURATION: 300,

  // Experience Picker
  MAX_EXPERIENCE_OPTIONS: 20,

  // Socials
  AVAILABLE_SOCIALS: [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "whatsapp",
  ] as const satisfies readonly ShareSocial[],
} as const;

/**
 * Default values for step creation by type
 */
export const STEP_DEFAULTS: Record<
  StepType,
  {
    title: string;
    ctaLabel: string;
    config?: Record<string, unknown>;
  }
> = {
  info: {
    title: "Welcome",
    ctaLabel: "Continue",
  },
  "experience-picker": {
    title: "Choose an Experience",
    ctaLabel: "Continue",
    config: {
      layout: "grid",
      variable: "selected_experience_id",
      experienceIds: [],
    },
  },
  capture: {
    title: "Capture Your Photo",
    ctaLabel: "Take Photo",
    config: {
      source: "selected_experience_id",
      fallbackExperienceId: null,
    },
  },
  short_text: {
    title: "Share Your Answer",
    ctaLabel: "Continue",
    config: {
      variable: "user_input",
      placeholder: "Enter your answer...",
      maxLength: 500,
      required: false,
    },
  },
  long_text: {
    title: "Share Your Thoughts",
    ctaLabel: "Continue",
    config: {
      variable: "user_input",
      placeholder: "Share your thoughts...",
      maxLength: 2000,
      required: false,
    },
  },
  multiple_choice: {
    title: "Make a Selection",
    ctaLabel: "Continue",
    config: {
      variable: "user_choice",
      options: [
        { label: "Option 1", value: "option_1" },
        { label: "Option 2", value: "option_2" },
      ],
      allowMultiple: false,
      required: false,
    },
  },
  yes_no: {
    title: "Your Choice",
    ctaLabel: "Continue",
    config: {
      variable: "user_answer",
      yesLabel: "Yes",
      noLabel: "No",
      required: false,
    },
  },
  opinion_scale: {
    title: "Rate Your Experience",
    ctaLabel: "Continue",
    config: {
      variable: "user_rating",
      scaleMin: 1,
      scaleMax: 5,
      minLabel: "Not at all",
      maxLabel: "Very much",
      required: false,
    },
  },
  email: {
    title: "Get Your Results",
    ctaLabel: "Continue",
    config: {
      variable: "user_email",
      placeholder: "email@example.com",
      required: false,
    },
  },
  processing: {
    title: "Creating Your Experience",
    ctaLabel: "",
    config: {
      messages: [
        "Creating your image...",
        "Almost there...",
        "Finishing touches...",
      ],
      estimatedDuration: 30,
    },
  },
  reward: {
    title: "Your Creation",
    ctaLabel: "Start Over",
    config: {
      allowDownload: true,
      allowSystemShare: true,
      allowEmail: false,
      socials: [],
    },
  },
};

/**
 * Step type metadata for UI display
 */
export interface StepTypeMeta {
  type: StepType;
  label: string;
  description: string;
  category: "navigation" | "capture" | "input" | "completion";
}

export const STEP_TYPE_META: StepTypeMeta[] = [
  // Navigation
  {
    type: "info",
    label: "Info",
    description: "Welcome or message screen",
    category: "navigation",
  },
  {
    type: "experience-picker",
    label: "Experience Picker",
    description: "Choose an AI experience",
    category: "navigation",
  },
  // Capture
  {
    type: "capture",
    label: "Capture",
    description: "Take a photo or video",
    category: "capture",
  },
  // Input
  {
    type: "short_text",
    label: "Short Text",
    description: "Single line text input",
    category: "input",
  },
  {
    type: "long_text",
    label: "Long Text",
    description: "Multi-line text input",
    category: "input",
  },
  {
    type: "multiple_choice",
    label: "Multiple Choice",
    description: "Select from options",
    category: "input",
  },
  {
    type: "yes_no",
    label: "Yes/No",
    description: "Binary choice",
    category: "input",
  },
  {
    type: "opinion_scale",
    label: "Opinion Scale",
    description: "Numeric rating scale",
    category: "input",
  },
  {
    type: "email",
    label: "Email",
    description: "Collect email address",
    category: "input",
  },
  // Completion
  {
    type: "processing",
    label: "Processing",
    description: "Loading/generation screen",
    category: "completion",
  },
  {
    type: "reward",
    label: "Reward",
    description: "Final result with sharing",
    category: "completion",
  },
];

/**
 * Get step type metadata by type
 */
export function getStepTypeMeta(type: StepType): StepTypeMeta | undefined {
  return STEP_TYPE_META.find((meta) => meta.type === type);
}
