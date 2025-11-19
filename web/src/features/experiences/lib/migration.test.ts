/**
 * Migration function tests for evolving experience schema
 */

import { migratePhotoExperience, stripLegacyFields } from "./migration";
import type { PhotoExperience } from "./schemas";

describe("migratePhotoExperience", () => {
  describe("already migrated documents", () => {
    it("should pass through already migrated document unchanged", () => {
      const migrated: PhotoExperience = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Already Migrated",
        type: "photo",
        enabled: true,
        hidden: false,
        config: {
          countdown: 3,
          overlayFramePath: "https://example.com/overlay.png",
        },
        aiConfig: {
          enabled: true,
          model: "flux-schnell",
          prompt: "Transform",
          referenceImagePaths: ["https://example.com/ref1.jpg"],
          aspectRatio: "1:1",
        },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(migrated);
      expect(result).toEqual(migrated);
    });
  });

  describe("legacy countdown fields migration", () => {
    it("should migrate countdownEnabled: true with countdownSeconds", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Legacy Countdown",
        type: "photo" as const,
        enabled: true,
        countdownEnabled: true,
        countdownSeconds: 5,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.countdown).toBe(5);
    });

    it("should migrate countdownEnabled: false to countdown: 0", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No Countdown",
        type: "photo" as const,
        enabled: true,
        countdownEnabled: false,
        countdownSeconds: 3, // ignored because countdownEnabled is false
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.countdown).toBe(0);
    });

    it("should default to countdown: 3 when countdownEnabled: true but no countdownSeconds", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Default Countdown",
        type: "photo" as const,
        enabled: true,
        countdownEnabled: true,
        // no countdownSeconds field
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.countdown).toBe(3);
    });

    it("should default to countdown: 0 when no countdown fields present", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No Countdown Fields",
        type: "photo" as const,
        enabled: true,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.countdown).toBe(0);
    });
  });

  describe("legacy overlay fields migration", () => {
    it("should migrate overlayFramePath when present", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "With Overlay",
        type: "photo" as const,
        enabled: true,
        overlayEnabled: true, // this field is ignored
        overlayFramePath: "https://example.com/overlay.png",
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.overlayFramePath).toBe(
        "https://example.com/overlay.png"
      );
    });

    it("should default overlayFramePath to null when missing", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No Overlay",
        type: "photo" as const,
        enabled: true,
        overlayEnabled: false,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.config.overlayFramePath).toBeNull();
    });
  });

  describe("legacy AI fields migration", () => {
    it("should migrate all AI fields when present", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "With AI",
        type: "photo" as const,
        enabled: true,
        aiEnabled: true,
        aiModel: "flux-schnell",
        aiPrompt: "Transform into vintage style",
        aiReferenceImagePaths: [
          "https://example.com/ref1.jpg",
          "https://example.com/ref2.jpg",
        ],
        aiAspectRatio: "1:1" as const,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.aiConfig).toEqual({
        enabled: true,
        model: "flux-schnell",
        prompt: "Transform into vintage style",
        referenceImagePaths: [
          "https://example.com/ref1.jpg",
          "https://example.com/ref2.jpg",
        ],
        aspectRatio: "1:1",
      });
    });

    it("should default AI fields when aiEnabled is false", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "AI Disabled",
        type: "photo" as const,
        enabled: true,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.aiConfig).toEqual({
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: "1:1", // default
      });
    });

    it("should default aiEnabled to false when missing", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No AI Fields",
        type: "photo" as const,
        enabled: true,
        // no aiEnabled field
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.aiConfig.enabled).toBe(false);
    });

    it("should default aspectRatio to '1:1' when missing", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No Aspect Ratio",
        type: "photo" as const,
        enabled: true,
        aiEnabled: true,
        aiModel: "flux-schnell",
        // no aiAspectRatio field
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.aiConfig.aspectRatio).toBe("1:1");
    });
  });

  describe("mixed old and new fields", () => {
    it("should prioritize new schema fields over legacy fields", () => {
      const mixed = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Mixed Schema",
        type: "photo" as const,
        enabled: true,
        // Legacy fields
        countdownEnabled: true,
        countdownSeconds: 3,
        aiEnabled: false,
        // New schema fields (should take precedence)
        config: {
          countdown: 7, // overrides countdownSeconds
          overlayFramePath: "https://example.com/new-overlay.png",
        },
        aiConfig: {
          enabled: true, // overrides aiEnabled
          model: "new-model",
          prompt: "New prompt",
          referenceImagePaths: null,
          aspectRatio: "9:16" as const,
        },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(mixed);
      expect(result.config.countdown).toBe(7); // from new schema, not 3
      expect(result.aiConfig.enabled).toBe(true); // from new schema, not false
      expect(result.aiConfig.model).toBe("new-model");
      expect(result.aiConfig.aspectRatio).toBe("9:16");
    });
  });

  describe("preview fields migration", () => {
    it("should preserve preview fields when present", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "With Preview",
        type: "photo" as const,
        enabled: true,
        previewPath: "https://example.com/preview.jpg",
        previewType: "image" as const,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.previewPath).toBe("https://example.com/preview.jpg");
      expect(result.previewType).toBe("image");
    });

    it("should omit preview fields when missing", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "No Preview",
        type: "photo" as const,
        enabled: true,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.previewPath).toBeUndefined();
      expect(result.previewType).toBeUndefined();
    });
  });

  describe("hidden field migration", () => {
    it("should preserve hidden field when true", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Hidden Experience",
        type: "photo" as const,
        enabled: true,
        hidden: true,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.hidden).toBe(true);
    });

    it("should default hidden to false when missing", () => {
      const legacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Visible Experience",
        type: "photo" as const,
        enabled: true,
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      const result = migratePhotoExperience(legacy);
      expect(result.hidden).toBe(false);
    });
  });

  describe("validation failures", () => {
    it("should throw error for null input", () => {
      expect(() => {
        migratePhotoExperience(null);
      }).toThrow("Invalid legacy data: expected object");
    });

    it("should throw error for non-object input", () => {
      expect(() => {
        migratePhotoExperience("not an object");
      }).toThrow("Invalid legacy data: expected object");
    });

    it("should throw validation error for invalid migrated data", () => {
      const invalidLegacy = {
        id: "exp_123",
        eventId: "evt_456",
        label: "Invalid",
        type: "photo" as const,
        enabled: true,
        countdownEnabled: true,
        countdownSeconds: 99, // exceeds max of 10
        aiEnabled: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      };

      expect(() => {
        migratePhotoExperience(invalidLegacy);
      }).toThrow("Migration validation failed");
    });
  });
});

describe("stripLegacyFields", () => {
  it("should remove all legacy countdown fields", () => {
    const migratedWithLegacy: any = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Clean Me",
      type: "photo",
      enabled: true,
      hidden: false,
      config: {
        countdown: 3,
        overlayFramePath: null,
      },
      aiConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: "1:1",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      // Legacy fields to remove
      countdownEnabled: true,
      countdownSeconds: 3,
      overlayEnabled: false,
    };

    const cleaned = stripLegacyFields(migratedWithLegacy);
    expect(cleaned).not.toHaveProperty("countdownEnabled");
    expect(cleaned).not.toHaveProperty("countdownSeconds");
    expect(cleaned).not.toHaveProperty("overlayEnabled");
  });

  it("should remove all legacy AI fields", () => {
    const migratedWithLegacy: any = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Clean Me",
      type: "photo",
      enabled: true,
      hidden: false,
      config: {
        countdown: 0,
        overlayFramePath: null,
      },
      aiConfig: {
        enabled: true,
        model: "flux-schnell",
        prompt: "Transform",
        referenceImagePaths: null,
        aspectRatio: "1:1",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      // Legacy AI fields to remove
      aiEnabled: true,
      aiModel: "flux-schnell",
      aiPrompt: "Transform",
      aiReferenceImagePaths: null,
      aiAspectRatio: "1:1",
    };

    const cleaned = stripLegacyFields(migratedWithLegacy);
    expect(cleaned).not.toHaveProperty("aiEnabled");
    expect(cleaned).not.toHaveProperty("aiModel");
    expect(cleaned).not.toHaveProperty("aiPrompt");
    expect(cleaned).not.toHaveProperty("aiReferenceImagePaths");
    expect(cleaned).not.toHaveProperty("aiAspectRatio");
  });

  it("should preserve all new schema fields", () => {
    const migratedWithLegacy: any = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Clean Me",
      type: "photo",
      enabled: true,
      hidden: false,
      previewPath: "https://example.com/preview.jpg",
      previewType: "image",
      config: {
        countdown: 5,
        overlayFramePath: "https://example.com/overlay.png",
      },
      aiConfig: {
        enabled: true,
        model: "flux-schnell",
        prompt: "Transform",
        referenceImagePaths: ["https://example.com/ref1.jpg"],
        aspectRatio: "9:16",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      // Legacy fields
      countdownEnabled: true,
      aiEnabled: true,
    };

    const cleaned = stripLegacyFields(migratedWithLegacy);
    expect(cleaned.id).toBe("exp_123");
    expect(cleaned.eventId).toBe("evt_456");
    expect(cleaned.label).toBe("Clean Me");
    expect(cleaned.type).toBe("photo");
    expect(cleaned.enabled).toBe(true);
    expect(cleaned.hidden).toBe(false);
    expect(cleaned.previewPath).toBe("https://example.com/preview.jpg");
    expect(cleaned.previewType).toBe("image");
    expect(cleaned.config).toEqual({
      countdown: 5,
      overlayFramePath: "https://example.com/overlay.png",
    });
    expect(cleaned.aiConfig).toEqual({
      enabled: true,
      model: "flux-schnell",
      prompt: "Transform",
      referenceImagePaths: ["https://example.com/ref1.jpg"],
      aspectRatio: "9:16",
    });
    expect(cleaned.createdAt).toBe(1700000000000);
    expect(cleaned.updatedAt).toBe(1700000000000);
  });

  it("should handle document with no legacy fields", () => {
    const cleanDoc: PhotoExperience = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Already Clean",
      type: "photo",
      enabled: true,
      hidden: false,
      config: {
        countdown: 0,
        overlayFramePath: null,
      },
      aiConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: "1:1",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = stripLegacyFields(cleanDoc);
    expect(result).toEqual(cleanDoc);
  });
});
