import { onRequest } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import { GoogleGenAI } from '@google/genai'
import '../infra/firebase-admin' // Initialize Firebase Admin

// Configuration: GOOGLE_CLOUD_PROJECT is auto-provided by Firebase runtime
// Only need to define the Vertex AI location
const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

const GOOGLE_CLOUD_PROJECT =
  process.env['GCLOUD_PROJECT'] || process.env['GOOGLE_CLOUD_PROJECT']

const MODEL = 'gemini-2.5-flash-image'

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

      console.log('Starting...', {
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
        model: MODEL,
      })

      // Get project ID from Firebase runtime (auto-provided)

      if (!GOOGLE_CLOUD_PROJECT) {
        throw new Error('Project ID not available')
      }

      // Initialize Vertex AI client
      const client = new GoogleGenAI({
        vertexai: true,
        project: GOOGLE_CLOUD_PROJECT,
        location: VERTEX_AI_LOCATION.value(),
      })
      // Generate content
      const response = await client.models.generateContent({
        model: MODEL,
        contents: prompt,
      })

      const generatedText = response.text

      console.log('Content generated successfully')

      res.status(200).json({
        success: true,
        prompt,
        result: generatedText,
        metadata: {
          project: GOOGLE_CLOUD_PROJECT,
          location: VERTEX_AI_LOCATION.value(),
          model: MODEL,
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
