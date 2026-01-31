import { onRequest } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  Modality,
  SafetySetting,
} from '@google/genai'
import { storage } from '../infra/firebase-admin'
import { uploadBufferToStorage } from '../infra/storage'

// Configuration: GOOGLE_CLOUD_PROJECT is auto-provided by Firebase runtime
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

const IMAGE_MODEL = 'gemini-2.5-flash-image'

// Reference image paths in Firebase Storage
const REFERENCE_IMAGES = [
  {
    id: 'userPhoto_abc123',
    path: 'test/black-woman.jpeg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'catPhoto_abc123',
    path: 'test/bonya.jpg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'artStylePhoto_abc123',
    path: 'test/art_style_1.jpg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'artStylePhoto_xyz789',
    path: 'test/art_style_2.jpeg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'bgPhoto_hobbiton',
    path: 'test/bg_hobbiton.jpg',
    mimeType: 'image/jpeg',
  },
  {
    id: 'weaponPhoto_dagger',
    path: 'test/weapon_dagger.webp',
    mimeType: 'image/webp',
  },
]

const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_IMAGE_HARASSMENT,
    threshold: HarmBlockThreshold.OFF,
  },
]

/**
 * Build parts array for Gemini API with image references and prompt
 *
 * @param bucketName - Firebase Storage bucket name
 * @returns Parts array for generateContent
 */
function buildImageGenerationParts(bucketName: string): any[] {
  const parts: any[] = []

  // Add each reference image with its ID label
  for (const refImage of REFERENCE_IMAGES) {
    // Add text label for the image reference
    parts.push({
      text: `Image Reference ID: <${refImage.id}>`,
    })

    // Add the image data
    parts.push({
      fileData: {
        mimeType: refImage.mimeType,
        fileUri: `gs://${bucketName}/${refImage.path}`,
      },
    })
  }

  // Build the prompt with image ID references
  const prompt = `Transform the person from <userPhoto_abc123> into hobbit from Middle Earth. With a cat sitting next to them (see <catPhoto_abc123>). Person should be holding a dagger (see <weaponPhoto_dagger>). Make photo in the art style of the <artStylePhoto_xyz789>.`

  // Add the final prompt
  parts.push({
    text: prompt,
  })

  return parts
}

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
 * HTTP Cloud Function to test Vertex AI image generation with reference images
 *
 * Generates: "Turn person from user photo into a Hobbit from Middle Earth
 * with a cat sitting next to them (see cat image)"
 *
 * Test with:
 * curl -X POST http://localhost:5003/clementine-7568d/europe-west1/testImageGenerationWithReference
 */
export const testImageGenerationWithReference = onRequest(
  {
    region: 'europe-west1',
    cors: true,
    timeoutSeconds: 300, // Image generation can take longer
  },
  async (req, res) => {
    const startTime = Date.now()

    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      if (!GOOGLE_CLOUD_PROJECT) {
        throw new Error('Project ID not available')
      }

      const bucket = storage.bucket()
      const bucketName = bucket.name

      console.log('Generating image with reference images...', {
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
        model: IMAGE_MODEL,
        bucket: bucketName,
      })

      // Initialize Vertex AI client
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
      })

      // Build parts array with image references and prompt
      // Gemini API expects this pattern:
      // { text: 'Image Reference ID: <id>' }, { fileData: {...} }, ...
      const parts = buildImageGenerationParts(bucketName)

      // Generation config
      const generationConfig = {
        maxOutputTokens: 32768,
        temperature: 1,
        topP: 0.95,
        responseModalities: [Modality.IMAGE],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K',
          outputMimeType: 'image/png',
        },
        safetySettings: SAFETY_SETTINGS,
      }

      console.log('Generating image with AI...')

      // Generate image with reference images (non-streaming, image only)
      const response = await client.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: generationConfig,
      })

      // Extract image from response
      const imageBuffer = extractImageFromResponse(response)

      // Save to Firebase Storage
      const fileName = `test/generated-hobbit-${Date.now()}.png`

      console.log(`Saving image to storage: ${fileName}`)

      const imageUrl = await uploadBufferToStorage(
        imageBuffer,
        fileName,
        'image/png',
        {
          generatedAt: new Date().toISOString(),
          model: IMAGE_MODEL,
        },
      )

      const completionTime = Date.now() - startTime

      console.log('Image generated and saved successfully', {
        fileName,
        imageUrl,
        completionTime: `${completionTime}ms`,
      })

      res.status(200).json({
        success: true,
        imageUrl,
        storagePath: fileName,
        referenceImages: REFERENCE_IMAGES,
        completionTime,
        metadata: {
          project: GOOGLE_CLOUD_PROJECT,
          location: VERTEX_AI_LOCATION.value(),
          model: IMAGE_MODEL,
        },
      })
    } catch (error) {
      console.error(
        'Error in testImageGenerationWithReference endpoint:',
        error,
      )
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)
