import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { parseFileDataUrl, saveUploadedFile, MAX_FILE_SIZE } from './upload'

vi.mock('node:fs', () => {
  return {
    default: {
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    },
  }
})

describe('Upload Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseFileDataUrl', () => {
    it('should correctly parse valid PNG base64 data url', () => {
      const validDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const parsed = parseFileDataUrl(validDataUrl)
      expect(parsed).not.toBeNull()
      expect(parsed!.mime).toBe('image/png')
      expect(parsed!.ext).toBe('png')
      expect(parsed!.buffer).toBeInstanceOf(Buffer)
    })

    it('should return null for invalid data urls', () => {
      expect(parseFileDataUrl('invalid-data')).toBeNull()
      expect(parseFileDataUrl('data:image/png;base64')).toBeNull()
      expect(parseFileDataUrl(null as any)).toBeNull()
    })

    it('should return null for unsupported mime types', () => {
      const unsupportedMime = 'data:text/html;base64,SGVsbG8='
      expect(parseFileDataUrl(unsupportedMime)).toBeNull()
    })

    it('should return null if file size exceeds MAX_FILE_SIZE', () => {
      const largeData = Buffer.alloc(MAX_FILE_SIZE + 100).toString('base64')
      const giantDataUrl = `data:image/png;base64,${largeData}`
      expect(parseFileDataUrl(giantDataUrl)).toBeNull()
    })
  })

  describe('saveUploadedFile', () => {
    it('should return null for invalid data url', () => {
      expect(saveUploadedFile('test', 'invalid')).toBeNull()
    })

    it('should write valid data URL to safe file path', () => {
      const validDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = saveUploadedFile('user_1', validDataUrl, 'my-avatar.png')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('my-avatar.png')
      expect(result!.mime).toBe('image/png')
      expect(result!.url).toContain('/api/uploads/user_1-')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('should sanitise prefix and file names', () => {
      const validDataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = saveUploadedFile('dir/../traversal', validDataUrl, 'bad/file?name.png')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('bad_file_name.png')
      expect(result!.url).not.toContain('../')
      expect(result!.url).toContain('dir____traversal-')
    })
  })
})
