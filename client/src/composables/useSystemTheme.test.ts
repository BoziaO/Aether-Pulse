import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

import { useSystemTheme } from './useSystemTheme'

describe('useSystemTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return midnight-lavender for dark mode', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { prefersDark, systemTheme } = useSystemTheme()
    expect(prefersDark.value).toBe(true)
    expect(systemTheme.value).toBe('midnight-lavender')
  })

  it('should return midnight-lavender for light mode (all themes are dark)', () => {
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { prefersDark, systemTheme } = useSystemTheme()
    expect(prefersDark.value).toBe(false)
    expect(systemTheme.value).toBe('midnight-lavender')
  })

  it('should default to prefersDark=true when matchMedia is not available', () => {
    // Temporarily remove matchMedia to simulate SSR/unavailable environment
    const original = window.matchMedia
    // @ts-expect-error - testing unavailable matchMedia
    delete window.matchMedia

    const { prefersDark } = useSystemTheme()
    expect(prefersDark.value).toBe(true)

    // Restore
    window.matchMedia = original
  })

  it('should update when system preference changes', async () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null

    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_, handler) => {
        changeHandler = handler as (e: MediaQueryListEvent) => void
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { prefersDark } = useSystemTheme()
    expect(prefersDark.value).toBe(true)

    // Simulate system preference change to light
    changeHandler?.({ matches: false } as MediaQueryListEvent)
    await nextTick()

    expect(prefersDark.value).toBe(false)
  })
})
