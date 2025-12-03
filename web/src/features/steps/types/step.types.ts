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
  eventId: string;
  journeyId: string;
  type: StepType;
  title?: string | null;
  description?: string | null;
  mediaUrl?: string | null;
  mediaType?: StepMediaType | null;
  ctaLabel?: string | null;
  createdAt: number;
  updatedAt: number;
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

