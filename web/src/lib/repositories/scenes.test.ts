import { db } from "@/lib/firebase/admin";
import type { Scene } from "@/lib/types/firestore";
import { updateScene, getScene } from "./scenes";

describe("Scenes Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateScene", () => {
    it("updates scene effect", async () => {
      const mockUpdate = jest.fn();

      const mockSceneRef = {
        update: mockUpdate,
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateScene("event-123", "scene-456", {
        effect: "deep_fake",
      });

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("scenes");
      expect(mockSceneCollection.doc).toHaveBeenCalledWith("scene-456");
      expect(mockUpdate).toHaveBeenCalledWith({
        effect: "deep_fake",
        updatedAt: expect.any(Number),
      });
    });

    it("updates scene prompt", async () => {
      const mockUpdate = jest.fn();

      const mockSceneRef = {
        update: mockUpdate,
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateScene("event-123", "scene-456", {
        prompt: "Custom AI transformation prompt",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        prompt: "Custom AI transformation prompt",
        updatedAt: expect.any(Number),
      });
    });

    it("updates scene reference image path", async () => {
      const mockUpdate = jest.fn();

      const mockSceneRef = {
        update: mockUpdate,
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateScene("event-123", "scene-456", {
        referenceImagePath: "scenes/scene-456/reference.jpg",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        referenceImagePath: "scenes/scene-456/reference.jpg",
        updatedAt: expect.any(Number),
      });
    });

    it("updates multiple scene properties", async () => {
      const mockUpdate = jest.fn();

      const mockSceneRef = {
        update: mockUpdate,
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateScene("event-123", "scene-456", {
        effect: "background_swap",
        prompt: "New prompt",
        referenceImagePath: "scenes/scene-456/ref.jpg",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        effect: "background_swap",
        prompt: "New prompt",
        referenceImagePath: "scenes/scene-456/ref.jpg",
        updatedAt: expect.any(Number),
      });
    });

    it("updates with empty object", async () => {
      const mockUpdate = jest.fn();

      const mockSceneRef = {
        update: mockUpdate,
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateScene("event-123", "scene-456", {});

      expect(mockUpdate).toHaveBeenCalledWith({
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("getScene", () => {
    it("returns scene when it exists", async () => {
      const mockSceneData = {
        label: "Test Scene",
        mode: "photo",
        effect: "background_swap",
        prompt: "Test prompt",
        defaultPrompt: "Default prompt",
        referenceImagePath: "scenes/scene-456/reference.jpg",
        flags: {
          customTextTool: true,
          stickersTool: false,
        },
        status: "active",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSceneDoc = {
        exists: true,
        id: "scene-456",
        data: jest.fn().mockReturnValue(mockSceneData),
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const scene = await getScene("event-123", "scene-456");

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("scenes");
      expect(scene).toEqual({ id: "scene-456", ...mockSceneData });
    });

    it("returns null when scene does not exist", async () => {
      const mockSceneDoc = {
        exists: false,
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const scene = await getScene("event-123", "nonexistent");

      expect(scene).toBeNull();
    });

    it("validates scene data with schema", async () => {
      const invalidSceneData = {
        label: "Test Scene",
        mode: "invalid-mode",
        effect: "background_swap",
        prompt: "",
        defaultPrompt: "Default",
        flags: {
          customTextTool: true,
          stickersTool: false,
        },
        status: "active",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSceneDoc = {
        exists: true,
        id: "scene-456",
        data: jest.fn().mockReturnValue(invalidSceneData),
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await expect(getScene("event-123", "scene-456")).rejects.toThrow();
    });

    it("handles scene without optional referenceImagePath", async () => {
      const mockSceneData = {
        label: "Minimal Scene",
        mode: "photo",
        effect: "deep_fake",
        prompt: "Prompt text",
        defaultPrompt: "Default prompt",
        flags: {
          customTextTool: false,
          stickersTool: false,
        },
        status: "deprecated",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSceneDoc = {
        exists: true,
        id: "scene-789",
        data: jest.fn().mockReturnValue(mockSceneData),
      };

      const mockSceneRef = {
        get: jest.fn().mockResolvedValue(mockSceneDoc),
      };

      const mockSceneCollection = {
        doc: jest.fn().mockReturnValue(mockSceneRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSceneCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const scene = await getScene("event-123", "scene-789");

      expect(scene).toEqual({ id: "scene-789", ...mockSceneData });
      expect(scene?.referenceImagePath).toBeUndefined();
    });
  });
});
