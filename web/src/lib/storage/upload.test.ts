import { storage } from "@/lib/firebase/admin";
import { getDownloadURL } from "firebase-admin/storage";
import {
  uploadInputImage,
  uploadResultImage,
  uploadReferenceImage,
  uploadQrCode,
  getSignedUrl,
  getPublicUrl,
} from "./upload";

jest.mock("@/lib/firebase/admin", () => ({
  storage: {
    file: jest.fn(),
    name: "test-bucket",
  },
}));

jest.mock("firebase-admin/storage", () => ({
  getDownloadURL: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-token"),
}));

describe("Storage Upload Utilities", () => {
  const mockStorage = storage as unknown as {
    file: ReturnType<typeof jest.fn>;
    name: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadInputImage", () => {
    it("uploads guest photo to correct path with proper metadata", async () => {
      const mockFile = new File(["test image content"], "photo.jpg", {
        type: "image/jpeg",
      });

      // Mock arrayBuffer method for File
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      });

      const mockBlob = {
        save: jest.fn().mockResolvedValue(undefined),
        makePublic: jest.fn().mockResolvedValue(undefined),
      };

      mockStorage.file.mockReturnValue(mockBlob);

      const url = await uploadInputImage("event-123", "session-456", mockFile);

      expect(url).toBe("https://storage.googleapis.com/test-bucket/events/event-123/sessions/session-456/input.jpg");
      expect(mockStorage.file).toHaveBeenCalledWith(
        "events/event-123/sessions/session-456/input.jpg"
      );
      expect(mockBlob.save).toHaveBeenCalledWith(expect.any(Buffer), {
        contentType: "image/jpeg",
      });
      expect(mockBlob.makePublic).toHaveBeenCalled();
    });

    it("rejects file exceeding size limit", async () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const mockFile = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      await expect(
        uploadInputImage("event-123", "session-456", mockFile)
      ).rejects.toThrow("File too large (max 10MB)");
    });

    it("rejects invalid file type", async () => {
      const mockFile = new File(["test"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(
        uploadInputImage("event-123", "session-456", mockFile)
      ).rejects.toThrow("Invalid file type. Only JPEG, PNG, WebP allowed.");
    });

    it("rejects invalid file extension", async () => {
      const mockFile = new File(["test"], "photo.bmp", {
        type: "image/jpeg", // valid type but invalid extension
      });

      await expect(
        uploadInputImage("event-123", "session-456", mockFile)
      ).rejects.toThrow("Invalid file extension");
    });
  });

  describe("uploadResultImage", () => {
    it("uploads AI result image to correct path", async () => {
      const buffer = Buffer.from("result image data");

      const mockBlob = {
        save: jest.fn().mockResolvedValue(undefined),
        makePublic: jest.fn().mockResolvedValue(undefined),
      };

      mockStorage.file.mockReturnValue(mockBlob);

      const url = await uploadResultImage("event-123", "session-456", buffer);

      expect(url).toBe("https://storage.googleapis.com/test-bucket/events/event-123/sessions/session-456/result.jpg");
      expect(mockStorage.file).toHaveBeenCalledWith(
        "events/event-123/sessions/session-456/result.jpg"
      );
      expect(mockBlob.save).toHaveBeenCalledWith(buffer, {
        contentType: "image/jpeg",
      });
      expect(mockBlob.makePublic).toHaveBeenCalled();
    });
  });

  describe("uploadReferenceImage", () => {
    it("uploads reference image with timestamped filename", async () => {
      const mockFile = new File(["reference image"], "background.png", {
        type: "image/png",
      });

      // Mock arrayBuffer method for File
      Object.defineProperty(mockFile, "arrayBuffer", {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      });

      const mockBlob = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockStorage.file.mockReturnValue(mockBlob);

      const now = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(now);

      const path = await uploadReferenceImage("event-123", mockFile);

      expect(path).toBe(`events/event-123/refs/${now}-background.png`);
      expect(mockStorage.file).toHaveBeenCalledWith(
        `events/event-123/refs/${now}-background.png`
      );
      expect(mockBlob.save).toHaveBeenCalledWith(expect.any(Buffer), {
        contentType: "image/png",
      });
    });

    it("validates reference image file", async () => {
      const mockFile = new File(["test"], "document.txt", {
        type: "text/plain",
      });

      await expect(uploadReferenceImage("event-123", mockFile)).rejects.toThrow(
        "Invalid file type"
      );
    });
  });

  describe("uploadQrCode", () => {
    it("uploads QR code to specified path", async () => {
      const buffer = Buffer.from("qr code data");
      const storagePath = "events/event-123/qr/join.png";

      const mockBlob = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockStorage.file.mockReturnValue(mockBlob);

      const path = await uploadQrCode(storagePath, buffer);

      expect(path).toBe(storagePath);
      expect(mockStorage.file).toHaveBeenCalledWith(storagePath);
      expect(mockBlob.save).toHaveBeenCalledWith(buffer, {
        contentType: "image/png",
      });
    });
  });

  describe("getSignedUrl", () => {
    it("generates signed URL with default expiration", async () => {
      const mockFile = {
        getSignedUrl: jest
          .fn()
          .mockResolvedValue(["https://signed-url.example.com"]),
      };

      mockStorage.file.mockReturnValue(mockFile);

      const url = await getSignedUrl("events/event-123/sessions/session-456/result.jpg");

      expect(url).toBe("https://signed-url.example.com");
      expect(mockStorage.file).toHaveBeenCalledWith(
        "events/event-123/sessions/session-456/result.jpg"
      );
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "read",
          expires: expect.any(Number),
        })
      );
    });

    it("generates signed URL with custom expiration", async () => {
      const mockFile = {
        getSignedUrl: jest
          .fn()
          .mockResolvedValue(["https://signed-url.example.com"]),
      };

      mockStorage.file.mockReturnValue(mockFile);

      const customExpiry = 7200; // 2 hours
      await getSignedUrl("path/to/file.jpg", customExpiry);

      expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "read",
        })
      );
    });
  });

  describe("getPublicUrl", () => {
    it("calls getDownloadURL with file reference", async () => {
      const mockGetDownloadURL = getDownloadURL as jest.Mock;
      const mockFile = {};

      mockStorage.file.mockReturnValue(mockFile);
      mockGetDownloadURL.mockResolvedValue("https://storage.example.com/download/file.png");

      const url = await getPublicUrl("events/event-123/qr/join.png");

      expect(mockStorage.file).toHaveBeenCalledWith("events/event-123/qr/join.png");
      expect(mockGetDownloadURL).toHaveBeenCalledWith(mockFile);
      expect(url).toBe("https://storage.example.com/download/file.png");
    });

    it("handles errors from getDownloadURL gracefully", async () => {
      const mockGetDownloadURL = getDownloadURL as jest.Mock;
      const mockFile = {};
      mockStorage.file.mockReturnValue(mockFile);
      mockGetDownloadURL.mockRejectedValue(new Error("File not found"));

      await expect(getPublicUrl("path/to/file.jpg")).rejects.toThrow(
        "Failed to get download URL for file"
      );
    });
  });
});
