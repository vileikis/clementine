/**
 * QR Code download utilities
 * Feature: 011-project-share-dialog
 */

/**
 * Converts SVG element to PNG data URL using canvas
 *
 * @param svgElement - SVG element to convert
 * @param width - PNG width in pixels
 * @param height - PNG height in pixels
 * @returns Promise resolving to PNG data URL
 * @throws Error if conversion fails
 */
export async function convertSvgToPng(
  svgElement: SVGElement,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 1. Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const svgUrl = URL.createObjectURL(svgBlob)

      // 2. Create canvas for conversion
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // 3. Load SVG as image and draw to canvas
      const img = new Image()

      img.onload = () => {
        // Draw SVG to canvas
        ctx.fillStyle = '#FFFFFF' // White background
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // Clean up SVG URL
        URL.revokeObjectURL(svgUrl)

        // 4. Convert canvas to PNG data URL
        const pngDataUrl = canvas.toDataURL('image/png')
        resolve(pngDataUrl)
      }

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('Failed to load SVG image'))
      }

      img.src = svgUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Triggers browser download of data URL
 *
 * @param dataUrl - Data URL to download
 * @param filename - Filename for download
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

/**
 * Downloads QR code as PNG image
 * Combines conversion and download steps
 *
 * @param svgElement - QR code SVG element
 * @param projectId - Project ID for filename
 * @param size - PNG size (default 512x512 for print quality)
 * @returns Promise that resolves when download is triggered
 */
export async function downloadQRCodeAsPng(
  svgElement: SVGElement,
  projectId: string,
  size: number = 512,
): Promise<void> {
  try {
    // Convert SVG to PNG
    const pngDataUrl = await convertSvgToPng(svgElement, size, size)

    // Trigger download
    const filename = `qr-code-${projectId}-${Date.now()}.png`
    downloadImage(pngDataUrl, filename)
  } catch (error) {
    console.error('Failed to download QR code:', error)
    throw error
  }
}
