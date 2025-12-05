/**
 * Unit tests for variable interpolation utility
 * Tests: Template variable replacement, graceful fallback, edge cases
 */

import { interpolateVariables, getCapturedPhotoUrl } from "../lib/variable-interpolation";
import type { AiTransformVariable } from "@/features/steps/types";
import type { SessionData } from "@/features/sessions";

// ============================================================================
// interpolateVariables Tests (T045)
// ============================================================================

describe("interpolateVariables", () => {
  describe("static variables", () => {
    it("replaces static variable with staticValue", () => {
      const prompt = "Create a {{style}} portrait";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [
        { key: "style", sourceType: "static", staticValue: "watercolor" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Create a watercolor portrait");
    });

    it("handles missing staticValue gracefully", () => {
      const prompt = "Create a {{style}} portrait";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [
        { key: "style", sourceType: "static" }, // No staticValue
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Create a  portrait");
    });
  });

  describe("capture variables", () => {
    it("replaces capture variable with photo URL", () => {
      const prompt = "Transform this image: {{photo}}";
      const sessionData: SessionData = {
        "capture-step-1": { type: "photo", url: "https://example.com/photo.jpg" },
      };
      const variables: AiTransformVariable[] = [
        { key: "photo", sourceType: "capture", sourceStepId: "capture-step-1" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Transform this image: https://example.com/photo.jpg");
    });

    it("handles missing capture gracefully", () => {
      const prompt = "Transform: {{photo}}";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [
        { key: "photo", sourceType: "capture", sourceStepId: "nonexistent" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Transform: ");
    });
  });

  describe("input variables", () => {
    it("replaces text input variable", () => {
      const prompt = "Hello, {{name}}!";
      const sessionData: SessionData = {
        "name-step": { type: "text", value: "World" },
      };
      const variables: AiTransformVariable[] = [
        { key: "name", sourceType: "input", sourceStepId: "name-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Hello, World!");
    });

    it("replaces boolean input variable as yes/no", () => {
      const prompt = "Show overlay: {{overlay}}";
      const sessionData: SessionData = {
        "bool-step": { type: "boolean", value: true },
      };
      const variables: AiTransformVariable[] = [
        { key: "overlay", sourceType: "input", sourceStepId: "bool-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Show overlay: yes");
    });

    it("replaces false boolean as no", () => {
      const prompt = "Show overlay: {{overlay}}";
      const sessionData: SessionData = {
        "bool-step": { type: "boolean", value: false },
      };
      const variables: AiTransformVariable[] = [
        { key: "overlay", sourceType: "input", sourceStepId: "bool-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Show overlay: no");
    });

    it("replaces number input variable", () => {
      const prompt = "Intensity: {{level}}";
      const sessionData: SessionData = {
        "number-step": { type: "number", value: 42 },
      };
      const variables: AiTransformVariable[] = [
        { key: "level", sourceType: "input", sourceStepId: "number-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Intensity: 42");
    });

    it("replaces selection input variable with selectedId", () => {
      const prompt = "Style: {{style}}";
      const sessionData: SessionData = {
        "style-step": { type: "selection", selectedId: "vintage" },
      };
      const variables: AiTransformVariable[] = [
        { key: "style", sourceType: "input", sourceStepId: "style-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Style: vintage");
    });

    it("replaces multi-selection input variable as comma-separated list", () => {
      const prompt = "Tags: {{tags}}";
      const sessionData: SessionData = {
        "tags-step": { type: "selections", selectedIds: ["fun", "colorful", "modern"] },
      };
      const variables: AiTransformVariable[] = [
        { key: "tags", sourceType: "input", sourceStepId: "tags-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Tags: fun, colorful, modern");
    });
  });

  describe("multiple variables", () => {
    it("replaces multiple variables in one prompt", () => {
      const prompt = "Create a {{style}} portrait of {{name}} at {{place}}";
      const sessionData: SessionData = {
        "name-step": { type: "text", value: "Alice" },
      };
      const variables: AiTransformVariable[] = [
        { key: "style", sourceType: "static", staticValue: "watercolor" },
        { key: "name", sourceType: "input", sourceStepId: "name-step" },
        { key: "place", sourceType: "static", staticValue: "the beach" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Create a watercolor portrait of Alice at the beach");
    });

    it("replaces all occurrences of the same variable", () => {
      const prompt = "{{name}} says hello. {{name}} is happy.";
      const sessionData: SessionData = {
        "name-step": { type: "text", value: "Bob" },
      };
      const variables: AiTransformVariable[] = [
        { key: "name", sourceType: "input", sourceStepId: "name-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Bob says hello. Bob is happy.");
    });
  });

  describe("edge cases", () => {
    it("returns original prompt when variables array is empty", () => {
      const prompt = "No variables {{here}}";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("No variables {{here}}");
    });

    it("handles empty prompt", () => {
      const prompt = "";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [
        { key: "test", sourceType: "static", staticValue: "value" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("");
    });

    it("handles raw string values in sessionData", () => {
      const prompt = "Experience: {{exp}}";
      const sessionData: SessionData = {
        selected_experience_id: "exp-123",
        "exp-step": "exp-456",
      };
      const variables: AiTransformVariable[] = [
        { key: "exp", sourceType: "input", sourceStepId: "exp-step" },
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Experience: exp-456");
    });

    it("handles undefined sourceStepId gracefully", () => {
      const prompt = "Test: {{var}}";
      const sessionData: SessionData = {};
      const variables: AiTransformVariable[] = [
        { key: "var", sourceType: "input" }, // No sourceStepId
      ];

      const result = interpolateVariables(prompt, sessionData, variables);

      expect(result).toBe("Test: ");
    });
  });
});

// ============================================================================
// getCapturedPhotoUrl Tests
// ============================================================================

describe("getCapturedPhotoUrl", () => {
  it("returns photo URL from specific step ID", () => {
    const sessionData: SessionData = {
      "capture-1": { type: "photo", url: "https://example.com/photo1.jpg" },
      "capture-2": { type: "photo", url: "https://example.com/photo2.jpg" },
    };

    const result = getCapturedPhotoUrl(sessionData, "capture-1");

    expect(result).toBe("https://example.com/photo1.jpg");
  });

  it("returns first photo URL when no step ID specified", () => {
    const sessionData: SessionData = {
      "text-step": { type: "text", value: "hello" },
      "capture-1": { type: "photo", url: "https://example.com/photo.jpg" },
    };

    const result = getCapturedPhotoUrl(sessionData);

    expect(result).toBe("https://example.com/photo.jpg");
  });

  it("returns undefined when no photo found", () => {
    const sessionData: SessionData = {
      "text-step": { type: "text", value: "hello" },
    };

    const result = getCapturedPhotoUrl(sessionData);

    expect(result).toBeUndefined();
  });

  it("falls back to first photo when specified step ID does not exist", () => {
    const sessionData: SessionData = {
      "capture-1": { type: "photo", url: "https://example.com/photo.jpg" },
    };

    // When specified step doesn't exist, falls back to finding any photo
    const result = getCapturedPhotoUrl(sessionData, "nonexistent");

    expect(result).toBe("https://example.com/photo.jpg");
  });

  it("returns undefined when step ID does not exist and no photos available", () => {
    const sessionData: SessionData = {
      "text-step": { type: "text", value: "hello" },
    };

    const result = getCapturedPhotoUrl(sessionData, "nonexistent");

    expect(result).toBeUndefined();
  });

  it("returns undefined when specified step is not a photo type", () => {
    const sessionData: SessionData = {
      "text-step": { type: "text", value: "hello" },
    };

    const result = getCapturedPhotoUrl(sessionData, "text-step");

    expect(result).toBeUndefined();
  });

  it("returns undefined for empty sessionData", () => {
    const sessionData: SessionData = {};

    const result = getCapturedPhotoUrl(sessionData);

    expect(result).toBeUndefined();
  });
});
