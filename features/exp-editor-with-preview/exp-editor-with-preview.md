# PRD 2: Experience Editor & AI Playground

**Focus:** The "Content." Configuring the logic and testing the output.
**Prerequisites:** PRD 1 must be implemented so we have an ID to route to.

## 1. Executive Summary

This feature implements the **Dedicated Editor Route**. It allows users to define the input types, configure the AI engine (Prompts/Models), and test the results in a real-time playground without leaving the context of the Event Studio.

## 2. Navigation & Layout

### 2.1 The Route

- **URL:** `/events/{eventId}/design/experiences/{experienceId}`.

### 2.2 Split-Screen Workspace

- **Header (Info)** Shows experience editor header with preview media, name, enabled switch and delete button.
- **Left Panel (Configuration):** Scrollable form area.
- **Right Panel (Playground):** Sticky/Fixed preview area.

## 3. Functional Requirements: Configuration (Left Panel)

### 3.1 General Info

- **Name:** Edit the Experience display name.
- **Description:** Internal notes.

### 3.2 AI Engine

- **Model Selector:** Dropdown (e.g., "gemini-2.5-flash-image", "gemini-3-pro-image-preview").
- **Prompt Editor:** Text area for the system prompt.
- **Branding Context (Read-only):** A visual indicator showing the system is detecting the Event's "Theme" (colors/keywords) to inject into the prompt.

## 4. Functional Requirements: The Playground (Right Panel)

### 4.1 Simulation

- **Upload:** Area to drag-and-drop a test file (matching the Input Configuration).
- **Generate Button:** Triggers the AI transformation.
- Logic from AI transfomrations /Users/iggyvileikis/Projects/@attempt-n2/clementine/web/src/lib/ai
- See Google Gemeni models docs https://ai.google.dev/gemini-api/docs/image-generation?batch=file#javascript_9

### 4.2 Output & Iteration

- **Loading State:** Visual feedback while the AI processes.
- **Result Display:** Renders the final image/video.
- **Save:** Persists the configuration changes (Prompt, Model, etc.) to the database.

## 5. Scope

### 5.1 In Scope

- **AI Photo Experience** - Full editor and playground support for photo-based AI transformations

### 5.2 Out of Scope

- **Video Experience** - Video capture and AI transformation not included in this PRD
- **GIF Editor** - GIF experience creation and editing not included in this PRD
