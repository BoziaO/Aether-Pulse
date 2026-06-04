export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

export const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return 'File too large (max 10MB)'
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return 'File type not supported'
  return null
}
