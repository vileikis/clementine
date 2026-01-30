import { onRequest } from 'firebase-functions/v2/https'
import { defineBoolean, defineString } from 'firebase-functions/params'
import { GoogleGenAI } from '@google/genai'
import '../infra/firebase-admin' // Initialize Firebase Admin

// Define configuration parameters (not secrets)
const GOOGLE_GENAI_USE_VERTEXAI = defineBoolean('GOOGLE_GENAI_USE_VERTEXAI')
const GOOGLE_CLOUD_PROJECT = defineString('GOOGLE_CLOUD_PROJECT')
const GOOGLE_CLOUD_LOCATION = defineString('GOOGLE_CLOUD_LOCATION', {
  default: 'us-central1',
})

/**
 * HTTP Cloud Function endpoint to test Vertex AI content generation
 *
 * Test with:
 * curl -X POST https://your-region-your-project.cloudfunctions.net/testVertexAI \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt": "How does AI work?"}'
 */
export const testVertexAI = onRequest(
  {
    region: 'europe-west1',
    cors: true,
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      // Get prompt from request body
      const prompt = 'How does AI work?'

      // Initialize Vertex AI client
      const client = new GoogleGenAI({
        vertexai: GOOGLE_GENAI_USE_VERTEXAI.value(),
        project: GOOGLE_CLOUD_PROJECT.value(),
        location: GOOGLE_CLOUD_LOCATION.value(),
      })

      console.log('Generating content with Vertex AI...', {
        project: GOOGLE_CLOUD_PROJECT.value(),
        location: GOOGLE_CLOUD_LOCATION.value(),
        model: 'gemini-2.0-flash-exp',
      })

      // Generate content
      const model = 'gemini-3-flash-preview'
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      })

      const generatedText = response.text

      console.log('Content generated successfully')

      res.status(200).json({
        success: true,
        prompt,
        result: generatedText,
        metadata: {
          project: GOOGLE_CLOUD_PROJECT.value(),
          location: GOOGLE_CLOUD_LOCATION.value(),
          model,
        },
      })
    } catch (error) {
      console.error('Error in testVertexAI endpoint:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)
