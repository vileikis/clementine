/**
 * Veo Safety Constants
 *
 * Support code → safety category mappings and user-friendly labels
 * for Veo video generation safety filter errors.
 *
 * @see https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/responsible-ai-and-usage-guidelines
 */

/**
 * Veo support code → safety category mapping
 *
 * Support codes are 8-digit identifiers returned in Veo error messages
 * when content is blocked by safety filters.
 */
export const VEO_SUPPORT_CODE_CATEGORIES: Record<string, string> = {
  // Sexual content
  '90789179': 'sexual_content',
  '43188360': 'sexual_content',
  // Violence
  '61493863': 'violence',
  '56562880': 'violence',
  // Dangerous content
  '62263041': 'dangerous_content',
  // Hate
  '57734940': 'hate',
  '22137204': 'hate',
  // Toxic
  '78610348': 'toxic_content',
  // Vulgar
  '32635315': 'vulgar_content',
  // Celebrity likeness
  '29310472': 'celebrity_likeness',
  '15236754': 'celebrity_likeness',
  // Child safety
  '58061214': 'child_safety',
  '17301594': 'child_safety',
  // Prohibited content
  '89371032': 'prohibited_content',
  '49114662': 'prohibited_content',
  '63429089': 'prohibited_content',
  '72817394': 'prohibited_content',
  '60599140': 'prohibited_content',
  // Third-party content
  '35561574': 'third_party_content',
  '35561575': 'third_party_content',
  // Video safety (general)
  '64151117': 'video_safety',
  '42237218': 'video_safety',
  // PII
  '92201652': 'personal_information',
  // Other
  '74803281': 'other',
  '29578790': 'other',
  '42876398': 'other',
}

/** User-friendly labels for safety categories */
export const SAFETY_CATEGORY_LABELS: Record<string, string> = {
  sexual_content: 'explicit content',
  violence: 'violent content',
  dangerous_content: 'dangerous content',
  hate: 'hateful content',
  toxic_content: 'toxic content',
  vulgar_content: 'vulgar content',
  celebrity_likeness: 'celebrity likeness',
  child_safety: 'content policy violation',
  prohibited_content: 'content policy violation',
  third_party_content: 'third-party content',
  video_safety: 'safety violation',
  personal_information: 'personal information',
  other: 'content policy violation',
}
