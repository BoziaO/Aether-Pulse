import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useSettingsStore } from './settings.store'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default theme', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('dark')
  })
})
