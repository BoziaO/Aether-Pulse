import fs from 'node:fs'
import path from 'node:path'

const uploadsDir = path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const ALLOWED_MIMES: Record<string, string> = {
  // Images
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/apng': 'apng',
  'image/avif': 'avif',

  // Documents
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/zip': 'zip',
  'application/x-rar-compressed': 'rar',
  'application/x-7z-compressed': '7z',

  // Audio
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/flac': 'flac',

  // Video
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_DATA_URL_LENGTH = 15 * 1024 * 1024 // 15MB (accounts for base64 overhead)

export function parseFileDataUrl(
  dataUrl: string
): { buffer: Buffer; ext: string; mime: string } | null {
  if (typeof dataUrl !== 'string') return null

  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl)
  if (!match) return null

  const mime = match[1].toLowerCase()
  const ext = ALLOWED_MIMES[mime]
  if (!ext) return null

  // Verify the extension contains only alphanumeric characters as extra security
  if (!/^[a-zA-Z0-9]+$/.test(ext)) return null

  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > MAX_FILE_SIZE) return null

  return { buffer, ext, mime }
}

export function saveUploadedFile(
  prefix: string,
  dataUrl: string,
  originalName?: string
): {
  url: string
  name: string
  mime: string
} | null {
  if (typeof dataUrl !== 'string') return null
  if (dataUrl.length > MAX_DATA_URL_LENGTH) return null

  const parsed = parseFileDataUrl(dataUrl)
  if (!parsed) return null

  const safePrefix = typeof prefix === 'string' ? prefix.replace(/[^a-zA-Z0-9_-]/g, '_') : 'upload'
  const rawOriginalName = typeof originalName === 'string' ? originalName : `file.${parsed.ext}`
  const safeName = rawOriginalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)

  const fileName = `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`
  const safePath = path.join(uploadsDir, fileName)

  // Directory traversal prevention
  if (!safePath.startsWith(uploadsDir)) {
    return null
  }

  fs.writeFileSync(safePath, parsed.buffer)

  return {
    url: `/api/uploads/${fileName}`,
    name: safeName,
    mime: parsed.mime,
  }
}

export { MAX_FILE_SIZE, MAX_DATA_URL_LENGTH, ALLOWED_MIMES }
