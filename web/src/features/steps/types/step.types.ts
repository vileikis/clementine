// Step type definitions for the journey editor

/**
 * Media types supported in step editors
 */
export type StepMediaType = "image" | "gif" | "video" | "lottie";

/**
 * All available step types
 */
export type StepType =
  | "info"
  | "experience-picker"
  | "capture"
  | "ai-transform"
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email"
  | "processing"
  | "reward";

/**
 * Share social options for reward step
 */
export type ShareSocial =
  | "instagram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "whatsapp";

/**
 * Base fields shared by all step types
 */
export interface StepBase {
  id: string;
  experienceId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
  ctaLabel?: string | null;
  createdAt: number;
  updatedAt: number;
  /** @deprecated Used for backwards compatibility with legacy journeys */
  eventId?: string;
  /** @deprecated Used for backwards compatibility with legacy journeys */
  journeyId?: string;
}

// ============================================================================
// Step Type Definitions
// ============================================================================

/**
 * Info step - Universal message/welcome screen
 */
export interface StepInfo extends StepBase {
  type: "info";
}

/**
 * Capture step - Camera capture that loads Experience config at runtime
 */
export interface StepCapture extends StepBase {
  type: "capture";
  config: {
    source: string;
    fallbackExperienceId?: string | null;
  };
}

/**
 * AI Transform variable - maps prompt variables to input sources
 */
export interface AiTransformVariable {
  /** Variable name in prompt (without {{}} syntax) */
  key: string;
  /** Where the value comes from */
  sourceType: "capture" | "input" | "static";
  /** Step ID if sourceType is "capture" or "input" */
  sourceStepId?: string;
  /** Value if sourceType is "static" */
  staticValue?: string;
}

/**
 * AI Transform step configuration
 */
export interface AiTransformConfig {
  /** AI model identifier (e.g., "gemini-2.5-flash-image", "flux") */
  model: string | null;
  /** Prompt template with {{variable}} placeholders, max 1000 chars */
  prompt: string | null;
  /** How prompt variables are populated */
  variables: AiTransformVariable[];
  /** Result format */
  outputType: "image" | "video" | "gif";
  /** Aspect ratio (e.g., "1:1", "3:4", "4:3", "9:16", "16:9") */
  aspectRatio: string;
  /** Up to 5 reference image URLs */
  referenceImageUrls: string[];
}

/**
 * AI Transform step - AI-powered photo transformation
 */
export interface StepAiTransform extends StepBase {
  type: "ai-transform";
  config: AiTransformConfig;
}

/**
 * Short Text step - Single-line text input
 */
export interface StepShortText extends StepBase {
  type: "short_text";
  config: {
    variable: string;
    placeholder?: string | null;
    maxLength: number;
    required: boolean;
  };
}

/**
 * Long Text step - Multi-line textarea input
 */
export interface StepLongText extends StepBase {
  type: "long_text";
  config: {
    variable: string;
    placeholder?: string | null;
    maxLength: number;
    required: boolean;
  };
}

/**
 * Multiple choice option
 */
export interface MultipleChoiceOption {
  label: string;
  value: string;
}

/**
 * Multiple Choice step - Selection from predefined options
 */
export interface StepMultipleChoice extends StepBase {
  type: "multiple_choice";
  config: {
    variable: string;
    options: MultipleChoiceOption[];
    allowMultiple: boolean;
    required: boolean;
  };
}

/**
 * Yes/No step - Binary choice with customizable labels
 */
export interface StepYesNo extends StepBase {
  type: "yes_no";
  config: {
    variable: string;
    yesLabel: string;
    noLabel: string;
    required: boolean;
  };
}

/**
 * Opinion Scale step - Numeric scale selection with labels
 */
export interface StepOpinionScale extends StepBase {
  type: "opinion_scale";
  config: {
    variable: string;
    scaleMin: number;
    scaleMax: number;
    minLabel?: string | null;
    maxLabel?: string | null;
    required: boolean;
  };
}

/**
 * Email step - Email address collection
 */
export interface StepEmail extends StepBase {
  type: "email";
  config: {
    variable: string;
    placeholder?: string | null;
    required: boolean;
  };
}

/**
 * Processing step - Loading/generation screen with rotating messages
 */
export interface StepProcessing extends StepBase {
  type: "processing";
  config: {
    messages: string[];
    estimatedDuration: number;
  };
}

/**
 * Reward step - Final result display with sharing options
 */
export interface StepReward extends StepBase {
  type: "reward";
  config: {
    allowDownload: boolean;
    allowSystemShare: boolean;
    allowEmail: boolean;
    socials: ShareSocial[];
  };
}

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Union type of all step types
 */
export type Step =
  | StepInfo
  | StepCapture
  | StepAiTransform
  | StepShortText
  | StepLongText
  | StepMultipleChoice
  | StepYesNo
  | StepOpinionScale
  | StepEmail
  | StepProcessing
  | StepReward;

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract config type for a specific step type
 */
export type StepConfig<T extends StepType> = Extract<
  Step,
  { type: T }
> extends { config: infer C }
  ? C
  : never;

/**
 * Steps that have a config property
 */
export type StepWithConfig = Exclude<Step, StepInfo>;

/**
 * Input step types (collect user data)
 */
export type InputStepType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "yes_no"
  | "opinion_scale"
  | "email";

/**
 * Steps that set session variables
 */
export type VariableStepType =
  | InputStepType
  | "experience-picker"
  | "capture";

/**
 * Input type for step update mutations.
 * Allows updating base fields and type-specific config.
 */
export type StepUpdateInput = Partial<
  Pick<StepBase, "title" | "description" | "mediaUrl" | "mediaType" | "ctaLabel">
> & {
  config?: Record<string, unknown>;
};

