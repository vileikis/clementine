import { onRequest } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import { GoogleGenAI, Modality } from '@google/genai'
import { uploadBufferToStorage } from '../infra/storage'

// Configuration: GOOGLE_CLOUD_PROJECT is auto-provided by Firebase runtime
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

const IMAGE_MODEL = 'gemini-2.5-flash-image'

// Hardcoded test prompt
const TEST_PROMPT =
  'Generate an image of the Eiffel tower with fireworks in the background.'

/**
 * Extract single image buffer from Gemini API response
 *
 * @param response - Gemini API response
 * @returns Image buffer
 * @throws Error if no valid image data found
 */
function extractImageFromResponse(response: any): Buffer {
  // Validate response has candidates
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates in Gemini API response')
  }

  // Validate candidate structure
  const candidate = response.candidates[0]
  if (!candidate?.content?.parts) {
    throw new Error('No content parts in Gemini API response')
  }

  // Find the image part in the response
  for (const part of candidate.content.parts) {
    if (part.inlineData?.data) {
      // Convert base64 image data to buffer
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }

  throw new Error('No image data in Gemini API response')
}


/**
 * HTTP Cloud Function to test Vertex AI image generation (simple prompt)
 *
 * Test with:
 * curl -X POST http://localhost:5003/clementine-7568d/europe-west1/testImageGeneration
 */
export const testImageGeneration = onRequest(
  {
    region: 'europe-west1',
    cors: true,
    timeoutSeconds: 300, // Image generation can take longer
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      if (!GOOGLE_CLOUD_PROJECT) {
        throw new Error('Project ID not available')
      }

      console.log('Generating image with Vertex AI...', {
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
        model: IMAGE_MODEL,
        prompt: TEST_PROMPT,
      })

      // Initialize Vertex AI client
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
      })

      // Generate image (non-streaming, image only)
      const response = await client.models.generateContent({
        model: IMAGE_MODEL,
        contents: TEST_PROMPT,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      })

      // Extract image from response
      const imageBuffer = extractImageFromResponse(response)

      // Save to Firebase Storage
      const fileName = `test/generated-${Date.now()}.png`

      console.log(`Saving image to storage: ${fileName}`)

      const imageUrl = await uploadBufferToStorage(
        imageBuffer,
        fileName,
        'image/png',
        {
          prompt: TEST_PROMPT,
          generatedAt: new Date().toISOString(),
          model: IMAGE_MODEL,
        }
      )

      console.log('Image generated and saved successfully', {
        fileName,
        imageUrl,
      })

      res.status(200).json({
        success: true,
        prompt: TEST_PROMPT,
        imageUrl,
        storagePath: fileName,
        metadata: {
          project: GOOGLE_CLOUD_PROJECT,
          location: VERTEX_AI_LOCATION.value(),
          model: IMAGE_MODEL,
        },
      })
    } catch (error) {
      console.error('Error in testImageGeneration endpoint:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)
