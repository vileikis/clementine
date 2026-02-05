import { onRequest } from 'firebase-functions/v2/https'

/**
 * Hello World function to verify Firebase Functions deployment
 * and shared package integration.
 */
export const helloWorld = onRequest(
  {
    region: 'europe-west1',
  },
  (_request, response) => {
    response.json({
      message: 'Functions operational',
      sharedTypesWorking: true,
      timestamp: new Date().toISOString(),
    })
  },
)

/**
 * Transform Pipeline
 */
export { startTransformPipelineV2 } from './callable/startTransformPipeline'
export { transformPipelineJob } from './tasks/transformPipelineJob'

/**
 * Vertex AI Tests
 */
export { testVertexAI } from './http/testVertexAI'
export { testImageGeneration } from './http/testImageGeneration'
export { testImageGenerationWithReference } from './http/testImageGenerationWithReference'
