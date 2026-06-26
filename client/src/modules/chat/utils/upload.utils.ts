export interface FileValidation {
  valid: boolean
  error?: string
}

const MAX_FILE_SIZE = 25 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'video/mp4',
  'video/webm',
])

export function validateFile(file: File): FileValidation {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (max ${formatSize(MAX_FILE_SIZE)})`,
    }
  }

  if (!ALLOWED_TYPES.has(file.type) && !file.type.startsWith('image/')) {
    return {
      valid: false,
      error: `File type not supported: ${file.type}`,
    }
  }

  return { valid: true }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8
): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file

  const img = await createImageBitmap(file)
  let { width, height } = img

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  img.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Compression failed'))
      },
      file.type,
      quality
    )
  })
}

export function getFilePreviewUrl(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return fileToDataUrl(file)
  }
  return Promise.resolve('')
}
