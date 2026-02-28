/**
 * FFprobe utilities for getting media metadata
 */
import { spawn } from 'child_process'
import ffprobeStatic from 'ffprobe-static'

// Prefer FFPROBE_BIN env var (e.g. Homebrew ffprobe) over ffprobe-static.
// Mirrors FFMPEG_BIN alignment strategy in core.ts.
const FFPROBE_PATH = process.env.FFPROBE_BIN || ffprobeStatic.path

export interface MediaDimensions {
  width: number
  height: number
}

/**
 * Get dimensions of an image or video file using ffprobe
 *
 * @param filePath - Path to media file
 * @returns Width and height in pixels
 */
export async function getMediaDimensions(filePath: string): Promise<MediaDimensions> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'json',
      filePath,
    ]

    let stdout = ''
    let stderr = ''

    const process = spawn(FFPROBE_PATH, args)

    process.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    process.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('error', (err) => {
      reject(new Error(`ffprobe failed to start: ${err.message}`))
    })

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed with code ${code}: ${stderr}`))
        return
      }

      try {
        const result = JSON.parse(stdout)
        const stream = result.streams?.[0]

        if (!stream?.width || !stream?.height) {
          reject(new Error('Could not extract dimensions from ffprobe output'))
          return
        }

        resolve({
          width: stream.width,
          height: stream.height,
        })
      } catch (parseError) {
        reject(new Error(`Failed to parse ffprobe output: ${stdout}`))
      }
    })
  })
}
