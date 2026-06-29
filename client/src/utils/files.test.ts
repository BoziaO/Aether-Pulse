import { describe, it, expect } from 'vitest'

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, validateFile } from './files'

describe('files utils', () => {
  describe('ALLOWED_FILE_TYPES', () => {
    it('should include common image types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('image/png')
      expect(ALLOWED_FILE_TYPES).toContain('image/jpeg')
      expect(ALLOWED_FILE_TYPES).toContain('image/webp')
      expect(ALLOWED_FILE_TYPES).toContain('image/gif')
    })

    it('should include document types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('application/pdf')
      expect(ALLOWED_FILE_TYPES).toContain('text/plain')
    })

    it('should include media types', () => {
      expect(ALLOWED_FILE_TYPES).toContain('video/mp4')
      expect(ALLOWED_FILE_TYPES).toContain('audio/mpeg')
      expect(ALLOWED_FILE_TYPES).toContain('audio/wav')
    })
  })

  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    })
  })

  describe('validateFile', () => {
    it('should return null for valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      expect(validateFile(file)).toBeNull()
    })

    it('should return null for valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      expect(validateFile(file)).toBeNull()
    })

    it('should return error for unsupported file type', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
      expect(validateFile(file)).toBe('File type not supported')
    })

    it('should return error for files exceeding max size', () => {
      const largeContent = new Uint8Array(MAX_FILE_SIZE + 1)
      const file = new File([largeContent], 'large.png', { type: 'image/png' })
      expect(validateFile(file)).toBe('File too large (max 10MB)')
    })

    it('should return null for files at exactly max size', () => {
      const exactContent = new Uint8Array(MAX_FILE_SIZE)
      const file = new File([exactContent], 'exact.png', { type: 'image/png' })
      expect(validateFile(file)).toBeNull()
    })

    it('should return error for empty type string', () => {
      const file = new File(['test'], 'test', { type: '' })
      expect(validateFile(file)).toBe('File type not supported')
    })
  })
})
