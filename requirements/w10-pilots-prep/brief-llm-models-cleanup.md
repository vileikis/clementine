## Brief 1: LLM Models Cleanup & UI Adjustments

**Objective**
Clean up deprecated models and hide legacy UI components in the prompt composer to streamline the application and prevent errors.

**Acceptance Criteria**

- **Remove Deprecated Model**: Completely remove references, endpoints, and usage of the `gemini-3-pro-image-preview` AI image model from the codebase.
- **Hide Enhance Control**: Hide the "Enhance Prompt" control within the `PromptComposer` component.
- **Preserve Logic**: Ensure the "Enhance Prompt" code is hidden (e.g., via CSS `display: none` or a feature flag) rather than deleted, as it may be reactivated for future Veo versions.

**Technical Notes**
Verify that hiding the enhance control does not break any existing layout logic or grid spacing within the `PromptComposer`.
