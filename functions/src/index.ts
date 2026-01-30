import { onRequest } from "firebase-functions/v2/https";
import type { SessionProcessing } from "@clementine/shared";

/**
 * Hello World function to verify Firebase Functions deployment
 * and shared package integration.
 */
export const helloWorld = onRequest(
  {
    region: "europe-west1",
  },
  (request, response) => {
    // Create a mock SessionProcessing object to verify shared types work
    const mockSession: Partial<SessionProcessing> = {
      inputAssets: [
        {
          url: "https://storage.googleapis.com/test/image.jpg",
          filename: "image.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
          uploadedAt: Date.now(),
        },
      ],
    };

    response.json({
      message: "Functions operational",
      sharedTypesWorking: true,
      testSession: {
        id: "test",
        projectId: "test-project-v5",
        inputAssetsCount: mockSession.inputAssets?.length,
      },
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Media Processing Pipeline (Legacy POC)
 */
export { processMedia } from "./http/processMedia";
export { processMediaJob } from "./tasks/processMediaJob";

/**
 * Transform Pipeline (Phase 2)
 */
export { startTransformPipeline } from "./http/startTransformPipeline";
export { transformPipelineJob } from "./tasks/transformPipelineJob";

/**
 * Vertex AI Test
 */
export { testVertexAI } from "./http/testVertexAI";
