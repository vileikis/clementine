/**
 * Schema validation tests for experience discriminated unions
 * Refactored for normalized Firestore design (data-model-v4)
 */

import {
  photoExperienceSchema,
  videoExperienceSchema,
  gifExperienceSchema,
  experienceSchema,
  createPhotoExperienceSchema,
  createVideoExperienceSchema,
  createGifExperienceSchema,
  updatePhotoExperienceSchema,
  updateVideoExperienceSchema,
  updateGifExperienceSchema,
  type PhotoExperience,
  type VideoExperience,
  type GifExperience,
} from "./experiences.schemas";

describe("PhotoExperience Schema", () => {
  const validPhotoExperience: PhotoExperience = {
    id: "exp_123",
    companyId: "company_xyz",
    eventIds: ["evt_456", "evt_789"],
    name: "Summer Photo Booth",
    type: "photo",
    enabled: true,
    previewMediaUrl: "https://example.com/preview.jpg",
    previewType: "image",
    inputFields: null,
    captureConfig: {
      countdown: 3,
      cameraFacing: "front",
      overlayUrl: "https://example.com/overlay.png",
    },
    aiPhotoConfig: {
      enabled: true,
      model: "flux-schnell",
      prompt: "Transform into vintage style",
      referenceImageUrls: ["https://example.com/ref1.jpg"],
      aspectRatio: "1:1",
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it("should validate a valid photo experience", () => {
    const result = photoExperienceSchema.safeParse(validPhotoExperience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with empty eventIds array", () => {
    const experience = {
      ...validPhotoExperience,
      eventIds: [],
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with disabled countdown (countdown: 0)", () => {
    const experience = {
      ...validPhotoExperience,
      captureConfig: {
        countdown: 0,
        cameraFacing: "front" as const,
        overlayUrl: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with AI disabled", () => {
    const experience = {
      ...validPhotoExperience,
      aiPhotoConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImageUrls: null,
        aspectRatio: "1:1" as const,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should validate photo experience with all camera facing options", () => {
    const facingOptions = ["front", "back", "both"] as const;
    for (const facing of facingOptions) {
      const experience = {
        ...validPhotoExperience,
        captureConfig: {
          ...validPhotoExperience.captureConfig,
          cameraFacing: facing,
        },
      };
      const result = photoExperienceSchema.safeParse(experience);
      expect(result.success).toBe(true);
    }
  });

  it("should reject photo experience with invalid countdown (negative)", () => {
    const experience = {
      ...validPhotoExperience,
      captureConfig: {
        countdown: -1,
        cameraFacing: "front" as const,
        overlayUrl: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with invalid countdown (> 10)", () => {
    const experience = {
      ...validPhotoExperience,
      captureConfig: {
        countdown: 11,
        cameraFacing: "front" as const,
        overlayUrl: null,
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with invalid aspect ratio", () => {
    const experience = {
      ...validPhotoExperience,
      aiPhotoConfig: {
        ...validPhotoExperience.aiPhotoConfig,
        aspectRatio: "invalid",
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with prompt > 1000 chars", () => {
    const experience = {
      ...validPhotoExperience,
      aiPhotoConfig: {
        ...validPhotoExperience.aiPhotoConfig,
        prompt: "a".repeat(1001),
      },
    };
    const result = photoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with more than 5 reference images", () => {
    const experience = {
      ...validPhotoExperience,
      aiPhotoConfig: {
        ...validPhotoExperience.aiPhotoConfig,
        referenceImageUrls: [
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

  it("should reject photo experience with missing companyId", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companyId: _, ...experienceWithoutCompanyId } = validPhotoExperience;
    const result = photoExperienceSchema.safeParse(experienceWithoutCompanyId);
    expect(result.success).toBe(false);
  });

  it("should reject photo experience with missing eventIds", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { eventIds: _, ...experienceWithoutEventIds } = validPhotoExperience;
    const result = photoExperienceSchema.safeParse(experienceWithoutEventIds);
    expect(result.success).toBe(false);
  });
});

describe("VideoExperience Schema", () => {
  const validVideoExperience: VideoExperience = {
    id: "exp_video_123",
    companyId: "company_xyz",
    eventIds: ["evt_456"],
    name: "Cyberpunk Animation",
    type: "video",
    enabled: true,
    previewMediaUrl: "https://example.com/preview.mp4",
    previewType: "video",
    inputFields: null,
    captureConfig: {
      countdown: 5,
      cameraFacing: "front",
      minDuration: 3,
      maxDuration: 10,
    },
    aiVideoConfig: {
      enabled: true,
      model: "kling-video",
      prompt: "Animate with cyberpunk neon effects",
      referenceImageUrls: null,
      aspectRatio: "9:16",
      duration: 5,
      fps: 24,
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it("should validate a valid video experience", () => {
    const result = videoExperienceSchema.safeParse(validVideoExperience);
    expect(result.success).toBe(true);
  });

  it("should validate video experience with video-specific AI config fields", () => {
    const experience = {
      ...validVideoExperience,
      aiVideoConfig: {
        enabled: true,
        model: "runway",
        prompt: "Create motion",
        referenceImageUrls: ["https://example.com/start.jpg"],
        aspectRatio: "16:9" as const,
        duration: 10,
        fps: 30,
      },
    };
    const result = videoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(true);
  });

  it("should reject video experience with maxDuration > 60", () => {
    const experience = {
      ...validVideoExperience,
      captureConfig: {
        ...validVideoExperience.captureConfig,
        maxDuration: 61,
      },
    };
    const result = videoExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });
});

describe("GifExperience Schema", () => {
  const validGifExperience: GifExperience = {
    id: "exp_gif_123",
    companyId: "company_xyz",
    eventIds: ["evt_456"],
    name: "Sparkle Effect",
    type: "gif",
    enabled: false,
    previewMediaUrl: "https://example.com/preview.gif",
    previewType: "gif",
    inputFields: null,
    captureConfig: {
      countdown: 3,
      cameraFacing: "both",
      frameCount: 8,
    },
    aiPhotoConfig: {
      enabled: true,
      model: "stable-diffusion-xl",
      prompt: "Add sparkle and glitter effects",
      referenceImageUrls: null,
      aspectRatio: "1:1",
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it("should validate a valid gif experience", () => {
    const result = gifExperienceSchema.safeParse(validGifExperience);
    expect(result.success).toBe(true);
  });

  it("should validate gif experience uses aiPhotoConfig (not aiVideoConfig)", () => {
    // GIF uses photo AI config because it generates frames via image models
    const result = gifExperienceSchema.safeParse(validGifExperience);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aiPhotoConfig).toBeDefined();
    }
  });

  it("should reject gif experience with frameCount < 3", () => {
    const experience = {
      ...validGifExperience,
      captureConfig: {
        ...validGifExperience.captureConfig,
        frameCount: 2,
      },
    };
    const result = gifExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });

  it("should reject gif experience with frameCount > 10", () => {
    const experience = {
      ...validGifExperience,
      captureConfig: {
        ...validGifExperience.captureConfig,
        frameCount: 11,
      },
    };
    const result = gifExperienceSchema.safeParse(experience);
    expect(result.success).toBe(false);
  });
});

describe("Discriminated Union Schema", () => {
  it("should validate photo experience via discriminated union", () => {
    const photoExp: PhotoExperience = {
      id: "exp_123",
      companyId: "company_xyz",
      eventIds: ["evt_456"],
      name: "Photo Booth",
      type: "photo",
      enabled: true,
      inputFields: null,
      captureConfig: {
        countdown: 0,
        cameraFacing: "front",
        overlayUrl: null,
      },
      aiPhotoConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImageUrls: null,
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
      companyId: "company_xyz",
      eventIds: ["evt_456"],
      name: "Video Booth",
      type: "video",
      enabled: true,
      inputFields: null,
      captureConfig: {
        countdown: 3,
        cameraFacing: "front",
        maxDuration: 15,
      },
      aiVideoConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImageUrls: null,
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
      companyId: "company_xyz",
      eventIds: [],
      name: "GIF Booth",
      type: "gif",
      enabled: true,
      inputFields: null,
      captureConfig: {
        countdown: 3,
        cameraFacing: "front",
        frameCount: 5,
      },
      aiPhotoConfig: {
        enabled: false,
        model: null,
        prompt: null,
        referenceImageUrls: null,
        aspectRatio: "1:1",
      },
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(gifExp);
    expect(result.success).toBe(true);
  });

  it("should reject experience with invalid type discriminator", () => {
    const invalidExp = {
      id: "exp_123",
      companyId: "company_xyz",
      eventIds: [],
      name: "Invalid",
      type: "invalid",
      enabled: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(invalidExp);
    expect(result.success).toBe(false);
  });

  it("should reject wheel type (no longer supported)", () => {
    const wheelExp = {
      id: "exp_123",
      companyId: "company_xyz",
      eventIds: [],
      name: "Spin to Win",
      type: "wheel",
      enabled: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const result = experienceSchema.safeParse(wheelExp);
    expect(result.success).toBe(false);
  });
});

describe("Create Photo Experience Schema", () => {
  it("should validate valid create input with required fields", () => {
    const input = {
      companyId: "company_xyz",
      eventIds: ["evt_456"],
      name: "New Photo Booth",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should default eventIds to empty array if not provided", () => {
    const input = {
      companyId: "company_xyz",
      name: "New Photo Booth",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventIds).toEqual([]);
    }
  });

  it("should trim whitespace from name", () => {
    const input = {
      companyId: "company_xyz",
      name: "  Trimmed Name  ",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trimmed Name");
    }
  });

  it("should reject empty name", () => {
    const input = {
      companyId: "company_xyz",
      name: "",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject name > 50 characters", () => {
    const input = {
      companyId: "company_xyz",
      name: "a".repeat(51),
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject missing companyId", () => {
    const input = {
      name: "Photo Booth",
      type: "photo" as const,
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject non-photo type", () => {
    const input = {
      companyId: "company_xyz",
      name: "Video Booth",
      type: "video",
    };

    const result = createPhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("Create Video Experience Schema", () => {
  it("should validate valid create input", () => {
    const input = {
      companyId: "company_xyz",
      eventIds: ["evt_456"],
      name: "New Video Experience",
      type: "video" as const,
    };

    const result = createVideoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject non-video type", () => {
    const input = {
      companyId: "company_xyz",
      name: "Photo Booth",
      type: "photo",
    };

    const result = createVideoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("Create GIF Experience Schema", () => {
  it("should validate valid create input", () => {
    const input = {
      companyId: "company_xyz",
      eventIds: [],
      name: "New GIF Experience",
      type: "gif" as const,
    };

    const result = createGifExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("Update Photo Experience Schema", () => {
  it("should validate partial update with only name", () => {
    const input = {
      name: "Updated Name",
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate partial update with eventIds", () => {
    const input = {
      eventIds: ["evt_new", "evt_another"],
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate partial update with captureConfig fields", () => {
    const input = {
      captureConfig: {
        countdown: 5,
      },
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate partial update with aiPhotoConfig fields", () => {
    const input = {
      aiPhotoConfig: {
        enabled: true,
        prompt: "New prompt",
      },
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject unknown fields (strict mode)", () => {
    const input = {
      name: "Test",
      unknownField: "value",
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject invalid countdown value in captureConfig", () => {
    const input = {
      captureConfig: {
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

  it("should allow previewMediaUrl update", () => {
    const input = {
      previewMediaUrl: "https://example.com/new-preview.jpg",
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should allow setting previewMediaUrl to null", () => {
    const input = {
      previewMediaUrl: null,
    };

    const result = updatePhotoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("Update Video Experience Schema", () => {
  it("should validate partial update with aiVideoConfig", () => {
    const input = {
      aiVideoConfig: {
        enabled: true,
        duration: 10,
        fps: 30,
      },
    };

    const result = updateVideoExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("Update GIF Experience Schema", () => {
  it("should validate partial update with captureConfig", () => {
    const input = {
      captureConfig: {
        frameCount: 6,
      },
    };

    const result = updateGifExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should use aiPhotoConfig (not aiVideoConfig)", () => {
    const input = {
      aiPhotoConfig: {
        enabled: true,
        model: "stable-diffusion-xl",
      },
    };

    const result = updateGifExperienceSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
