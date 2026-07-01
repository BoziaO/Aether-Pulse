import { describe, it, expect } from 'vitest'
import mongoose from 'mongoose'
import { isValidObjectId } from './validators'

describe('isValidObjectId', () => {
  it('should return true for valid ObjectId', () => {
    const validId = new mongoose.Types.ObjectId().toString()
    expect(isValidObjectId(validId)).toBe(true)
  })

  it('should return false for invalid ObjectId', () => {
    expect(isValidObjectId('invalid')).toBe(false)
    expect(isValidObjectId('123')).toBe(false)
    expect(isValidObjectId('')).toBe(false)
  })

  it('should return false for ObjectId with wrong length', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false) // 23 chars
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false) // 25 chars
  })

  it('should return true for 24-character hex string', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true)
  })
})
