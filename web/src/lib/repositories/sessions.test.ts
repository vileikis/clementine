import { db } from "@/lib/firebase/admin";
import type { Session } from "@/lib/types/firestore";
import {
  startSession,
  saveCapture,
  updateSessionState,
  getSession,
} from "./sessions";

describe("Sessions Repository", () => {
  const mockDb = db as unknown as {
    collection: ReturnType<typeof jest.fn>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startSession", () => {
    it("creates a new session for an event", async () => {
      const mockEventData = {
        currentSceneId: "scene-123",
      };

      const mockEventDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockEventData),
      };

      const mockSessionRef = {
        id: "session-456",
        set: jest.fn(),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        get: jest.fn().mockResolvedValue(mockEventDoc),
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const sessionId = await startSession("event-123");

      expect(sessionId).toBe("session-456");
      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("sessions");

      // Verify session data structure
      const sessionData = mockSessionRef.set.mock.calls[0][0] as Session;
      expect(sessionData).toMatchObject({
        id: "session-456",
        eventId: "event-123",
        sceneId: "scene-123",
        state: "created",
      });
      expect(sessionData.createdAt).toBeGreaterThan(0);
      expect(sessionData.updatedAt).toBe(sessionData.createdAt);
    });

    it("throws error when event does not exist", async () => {
      const mockEventDoc = {
        exists: false,
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockEventDoc),
        }),
      });

      await expect(startSession("nonexistent")).rejects.toThrow(
        "Event not found"
      );
    });

    it("throws error when event has no current scene", async () => {
      const mockEventData = {
        currentSceneId: undefined,
      };

      const mockEventDoc = {
        exists: true,
        data: jest.fn().mockReturnValue(mockEventData),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockEventDoc),
        }),
      });

      await expect(startSession("event-123")).rejects.toThrow(
        "Event has no current scene"
      );
    });
  });

  describe("saveCapture", () => {
    it("updates session with input image path", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await saveCapture(
        "event-123",
        "session-456",
        "sessions/session-456/input.jpg"
      );

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(mockEventRef.collection).toHaveBeenCalledWith("sessions");
      expect(mockSessionCollection.doc).toHaveBeenCalledWith("session-456");
      expect(mockUpdate).toHaveBeenCalledWith({
        inputImagePath: "sessions/session-456/input.jpg",
        state: "captured",
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("updateSessionState", () => {
    it("updates session state only", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "transforming");

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "transforming",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with result image path", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "ready", {
        resultImagePath: "sessions/session-456/result.jpg",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "ready",
        resultImagePath: "sessions/session-456/result.jpg",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with error message", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "error", {
        error: "AI generation failed",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "error",
        error: "AI generation failed",
        updatedAt: expect.any(Number),
      });
    });

    it("updates session state with both result and error", async () => {
      const mockUpdate = jest.fn();

      const mockSessionRef = {
        update: mockUpdate,
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await updateSessionState("event-123", "session-456", "ready", {
        resultImagePath: "sessions/session-456/result.jpg",
        error: "Partial error",
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        state: "ready",
        resultImagePath: "sessions/session-456/result.jpg",
        error: "Partial error",
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("getSession", () => {
    it("returns session when it exists", async () => {
      const mockSessionData = {
        eventId: "event-123",
        sceneId: "scene-123",
        state: "ready",
        inputImagePath: "sessions/session-456/input.jpg",
        resultImagePath: "sessions/session-456/result.jpg",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSessionDoc = {
        exists: true,
        id: "session-456",
        data: jest.fn().mockReturnValue(mockSessionData),
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const session = await getSession("event-123", "session-456");

      expect(mockDb.collection).toHaveBeenCalledWith("events");
      expect(session).toEqual({ id: "session-456", ...mockSessionData });
    });

    it("returns null when session does not exist", async () => {
      const mockSessionDoc = {
        exists: false,
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      const session = await getSession("event-123", "nonexistent");

      expect(session).toBeNull();
    });

    it("validates session data with schema", async () => {
      const invalidSessionData = {
        eventId: "event-123",
        sceneId: "scene-123",
        state: "invalid-state",
        createdAt: 1234567890,
        updatedAt: 1234567900,
      };

      const mockSessionDoc = {
        exists: true,
        id: "session-456",
        data: jest.fn().mockReturnValue(invalidSessionData),
      };

      const mockSessionRef = {
        get: jest.fn().mockResolvedValue(mockSessionDoc),
      };

      const mockSessionCollection = {
        doc: jest.fn().mockReturnValue(mockSessionRef),
      };

      const mockEventRef = {
        collection: jest.fn().mockReturnValue(mockSessionCollection),
      };

      mockDb.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockEventRef),
      });

      await expect(getSession("event-123", "session-456")).rejects.toThrow();
    });
  });
});
