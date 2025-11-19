/**
 * Schema validation tests for experience discriminated unions
 */

import {
  photoExperienceSchema,
  videoExperienceSchema,
  gifExperienceSchema,
  wheelExperienceSchema,
  surveyExperienceSchema,
  experienceSchema,
  createPhotoExperienceSchema,
  updatePhotoExperienceSchema,
  type PhotoExperience,
} from "./schemas";

describe("PhotoExperience Schema", () => {
  const validPhotoExperience: PhotoExperience = {
    id: "exp_123",
    eventId: "evt_456",
    label: "Summer Photo Booth",
    type: "photo",
    enabled: true,
    hidden: false,
    previewPath: "https://example.com/preview.jpg",
    previewType: "image",
    config: {
      countdown: 3,
      overlayFramePath: "https://example.com/overlay.png",
    },
    aiConfig: {
      enabled: true,
      model: "flux-schnell",
      prompt: "Transform into vintage style",
      referenceImagePaths: ["https://example.com/ref1.jpg"],
      aspectRatio: "1:1",
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it("should validate a valid photo experience", () => {
    const result = photoExperienceSchema.safeParse(validPhotoExperience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with disabled countdown (countdown: 0)", () => {
    const experience = {
      ...validPhotoExperience,
      config: {
        countdown: 0,
        overlayFramePath: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with AI disabled", () => {
    const experience = {
      ...validPhotoExperience,
      aiConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: "1:1" as const,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should reject photo experience with invalid countdown (negative)", () => {
    const experience = {
      ...validPhotoExperience,
      config: {
        countdown: -1,
        overlayFramePath: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with invalid countdown (> 10)", () => {
    const experience = {
      ...validPhotoExperience,
      config: {
        countdown: 11,
        overlayFramePath: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with invalid aspect ratio", () => {
    const experience = {
      ...validPhotoExperience,
      aiConfig: {
        ...validPhotoExperience.aiConfig,
        aspectRatio: "invalid",
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with prompt > 600 chars", () => {
    const experience = {
      ...validPhotoExperience,
      aiConfig: {
        ...validPhotoExperience.aiConfig,
        prompt: "a".repeat(601),
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with more than 5 reference images", () => {
    const experience = {
      ...validPhotoExperience,
      aiConfig: {
        ...validPhotoExperience.aiConfig,
        referenceImagePaths: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
          "https://example.com/5.jpg",
          "https://example.com/6.jpg",
        ],
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with missing required fields", () => {
    const experience = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Test",
      type: "photo",
      // missing: enabled, config, aiConfig, createdAt, updatedAt
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });
});

describe("Discriminated Union Schema", () => {
  it("should validate photo experience via discriminated union", () => {
    const photoExp: PhotoExperience = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Photo Booth",
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

    const result = experienceSchema.safeParse(photoExp);
    expect(result.success).toBe(true);
  });

  it("should validate video experience via discriminated union", () => {
    const videoExp = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Video Booth",
      type: "video",
      enabled: true,
      hidden: false,
      config: {
        maxDurationSeconds: 15,
        allowRetake: true,
        countdown: 3,
      },
      aiConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImagePaths: null,
        aspectRatio: "9:16",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(videoExp);
    expect(result.success).toBe(true);
  });

  it("should validate gif experience via discriminated union", () => {
    const gifExp = {
      id: "exp_123",
      eventId: "evt_456",
      label: "GIF Booth",
      type: "gif",
      enabled: true,
      hidden: false,
      config: {
        frameCount: 5,
        intervalMs: 300,
        loopCount: 0,
        countdown: 3,
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

    const result = experienceSchema.safeParse(gifExp);
    expect(result.success).toBe(true);
  });

  it("should validate wheel experience via discriminated union (no aiConfig)", () => {
    const wheelExp = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Spin to Win",
      type: "wheel",
      enabled: true,
      hidden: false,
      config: {
        items: [
          {
            id: "item_1",
            label: "Prize 1",
            weight: 1,
            color: "#FF0000",
          },
          {
            id: "item_2",
            label: "Prize 2",
            weight: 1,
            color: "#00FF00",
          },
        ],
        spinDurationMs: 3000,
        autoSpin: false,
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(wheelExp);
    expect(result.success).toBe(true);
  });

  it("should validate survey experience via discriminated union (no aiConfig)", () => {
    const surveyExp = {
      id: "exp_123",
      eventId: "evt_456",
      label: "User Survey",
      type: "survey",
      enabled: true,
      hidden: false,
      config: {
        surveyStepIds: ["step_1", "step_2", "step_3"],
        required: true,
        showProgressBar: true,
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(surveyExp);
    expect(result.success).toBe(true);
  });

  it("should reject experience with invalid type discriminator", () => {
    const invalidExp = {
      id: "exp_123",
      eventId: "evt_456",
      label: "Invalid",
      type: "invalid",
      enabled: true,
      hidden: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(invalidExp);
    expect(result.success).toBe(false);
  });
});

describe("Create Photo Experience Schema", () => {
  it("should validate valid create input with only required fields", () => {
    const input = {
      label: "New Photo Booth",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should trim whitespace from label", () => {
    const input = {
      label: "  Trimmed Label  ",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe("Trimmed Label");
    }
  });

  it("should reject empty label", () => {
    const input = {
      label: "",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject label > 50 characters", () => {
    const input = {
      label: "a".repeat(51),
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-photo type", () => {
    const input = {
      label: "Video Booth",
      type: "video",
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("Update Photo Experience Schema", () => {
  it("should validate partial update with only label", () => {
    const input = {
      label: "Updated Label",
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate partial update with config fields", () => {
    const input = {
      config: {
        countdown: 5,
      },
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate partial update with aiConfig fields", () => {
    const input = {
      aiConfig: {
        enabled: true,
        prompt: "New prompt",
      },
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject unknown fields (strict mode)", () => {
    const input = {
      label: "Test",
      unknownField: "value",
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid countdown value in config", () => {
    const input = {
      config: {
        countdown: 15, // max is 10
      },
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should allow empty update object", () => {
    const input = {};

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
