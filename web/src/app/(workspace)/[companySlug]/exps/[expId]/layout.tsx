interface ExperienceLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for experience editor routes.
 * Header with tabs is handled by ExperienceEditorHeader (inside ExperienceEditor)
 * and ExperienceSettingsClient (for settings page).
 */
export default function ExperienceLayout({ children }: ExperienceLayoutProps) {
  return <>{children}</>;
}
