import {
  updateExperienceSchema,
  previewTypeSchema,
  uploadPreviewMediaSchema,
  aspectRatioSchema,
  experienceSchema,
} from "@/lib/schemas/firestore";

describe("Photo Experience Tweaks Schema Validation", () => {
  describe("User Story 1 - Simplified Capture Settings", () => {
    describe("T018 - updateExperienceSchema rejects deprecated fields", () => {
      it("rejects allowCamera field", () => {
        const invalidData = {
          label: "Test Experience",
          allowCamera: true,
        };

        const result = updateExperienceSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("rejects allowLibrary field", () => {
        const invalidData = {
          label: "Test Experience",
          allowLibrary: true,
        };

        const result = updateExperienceSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("accepts valid data without deprecated fields", () => {
        const validData = {
          label: "Test Experience",
          enabled: true,
          countdownEnabled: true,
        };

        const result = updateExperienceSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("User Story 2 - Rich Preview Media", () => {
    describe("T029 - previewTypeSchema accepts gif and video", () => {
      it("accepts image type", () => {
        const result = previewTypeSchema.safeParse("image");
        expect(result.success).toBe(true);
        expect(result.data).toBe("image");
      });

      it("accepts gif type", () => {
        const result = previewTypeSchema.safeParse("gif");
        expect(result.success).toBe(true);
        expect(result.data).toBe("gif");
      });

      it("accepts video type", () => {
        const result = previewTypeSchema.safeParse("video");
        expect(result.success).toBe(true);
        expect(result.data).toBe("video");
      });

      it("rejects invalid preview types", () => {
        const result = previewTypeSchema.safeParse("audio");
        expect(result.success).toBe(false);
      });
    });

    describe("T030 - uploadPreviewMediaSchema validates file type and size", () => {
      it("accepts valid image file under size limit", () => {
        const mockFile = new File(["test"], "test.png", { type: "image/png" });
        const validData = {
          file: mockFile,
          fileType: "image" as const,
          maxSizeBytes: 10 * 1024 * 1024,
        };

        const result = uploadPreviewMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("accepts valid gif file", () => {
        const mockFile = new File(["test"], "test.gif", { type: "image/gif" });
        const validData = {
          file: mockFile,
          fileType: "gif" as const,
          maxSizeBytes: 10 * 1024 * 1024,
        };

        const result = uploadPreviewMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("accepts valid video file", () => {
        const mockFile = new File(["test"], "test.mp4", {
          type: "video/mp4",
        });
        const validData = {
          file: mockFile,
          fileType: "video" as const,
          maxSizeBytes: 10 * 1024 * 1024,
        };

        const result = uploadPreviewMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("rejects invalid file type", () => {
        const mockFile = new File(["test"], "test.txt", { type: "text/plain" });
        const invalidData = {
          file: mockFile,
          fileType: "audio" as "image" | "gif" | "video",
          maxSizeBytes: 10 * 1024 * 1024,
        };

        const result = uploadPreviewMediaSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("uses default max size of 10MB when not specified", () => {
        const mockFile = new File(["test"], "test.png", { type: "image/png" });
        const validData = {
          file: mockFile,
          fileType: "image" as const,
        };

        const result = uploadPreviewMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.maxSizeBytes).toBe(10 * 1024 * 1024);
        }
      });
    });
  });

  describe("User Story 3 - Countdown Timer Control", () => {
    describe("T039 - countdownSeconds validates range (0-10)", () => {
      it("accepts 0 seconds", () => {
        const validData = {
          countdownSeconds: 0,
        };

        const result = updateExperienceSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("accepts 3 seconds (default)", () => {
        const validData = {
          countdownSeconds: 3,
        };

        const result = updateExperienceSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("accepts 10 seconds (max)", () => {
        const validData = {
          countdownSeconds: 10,
        };

        const result = updateExperienceSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("rejects negative values", () => {
        const invalidData = {
          countdownSeconds: -1,
        };

        const result = updateExperienceSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("rejects values above 10", () => {
        const invalidData = {
          countdownSeconds: 11,
        };

        const result = updateExperienceSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("rejects decimal values", () => {
        const invalidData = {
          countdownSeconds: 3.5,
        };

        const result = updateExperienceSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("User Story 5 - AI Transformation Settings", () => {
    describe("T061 - aiAspectRatio enum validates all 5 ratios", () => {
      it("accepts 1:1 (square)", () => {
        const result = aspectRatioSchema.safeParse("1:1");
        expect(result.success).toBe(true);
        expect(result.data).toBe("1:1");
      });

      it("accepts 3:4 (portrait)", () => {
        const result = aspectRatioSchema.safeParse("3:4");
        expect(result.success).toBe(true);
        expect(result.data).toBe("3:4");
      });

      it("accepts 4:5 (portrait)", () => {
        const result = aspectRatioSchema.safeParse("4:5");
        expect(result.success).toBe(true);
        expect(result.data).toBe("4:5");
      });

      it("accepts 9:16 (vertical)", () => {
        const result = aspectRatioSchema.safeParse("9:16");
        expect(result.success).toBe(true);
        expect(result.data).toBe("9:16");
      });

      it("accepts 16:9 (landscape)", () => {
        const result = aspectRatioSchema.safeParse("16:9");
        expect(result.success).toBe(true);
        expect(result.data).toBe("16:9");
      });

      it("rejects invalid aspect ratios", () => {
        const result = aspectRatioSchema.safeParse("21:9");
        expect(result.success).toBe(false);
      });

      it("rejects malformed aspect ratios", () => {
        const result = aspectRatioSchema.safeParse("1x1");
        expect(result.success).toBe(false);
      });
    });

    it("experienceSchema validates aiAspectRatio field", () => {
      const validData = {
        id: "exp-1",
        eventId: "event-1",
        label: "Test Experience",
        type: "photo" as const,
        enabled: true,
        aiEnabled: true,
        aiAspectRatio: "16:9" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = experienceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aiAspectRatio).toBe("16:9");
      }
    });

    it("experienceSchema defaults aiAspectRatio to 1:1 when not provided", () => {
      const validData = {
        id: "exp-1",
        eventId: "event-1",
        label: "Test Experience",
        type: "photo" as const,
        enabled: true,
        aiEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = experienceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aiAspectRatio).toBe("1:1");
      }
    });
  });

  describe("Integration Tests - Full Experience Validation", () => {
    it("validates complete experience with all new fields", () => {
      const completeExperience = {
        id: "exp-1",
        eventId: "event-1",
        label: "Photo Booth Experience",
        type: "photo" as const,
        enabled: true,
        previewPath: "previews/preview.gif",
        previewType: "gif" as const,
        countdownEnabled: true,
        countdownSeconds: 5,
        overlayEnabled: true,
        overlayFramePath: "overlays/frame.png",
        aiEnabled: true,
        aiModel: "flux-1.1-pro",
        aiPrompt: "Transform into a futuristic cyberpunk style",
        aiReferenceImagePaths: ["refs/ref1.png", "refs/ref2.png"],
        aiAspectRatio: "9:16" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = experienceSchema.safeParse(completeExperience);
      expect(result.success).toBe(true);
    });

    it("validates minimal experience with defaults", () => {
      const minimalExperience = {
        id: "exp-2",
        eventId: "event-2",
        label: "Simple Experience",
        type: "photo" as const,
        enabled: false,
        aiEnabled: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = experienceSchema.safeParse(minimalExperience);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.countdownEnabled).toBe(false);
        expect(result.data.countdownSeconds).toBe(3);
        expect(result.data.overlayEnabled).toBe(false);
        expect(result.data.aiAspectRatio).toBe("1:1");
      }
    });
  });
});
