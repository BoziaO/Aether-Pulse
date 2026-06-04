import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock Vue Router
const mockRouter = {
  push: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      params: {},
      query: {},
      hash: '',
      name: undefined,
      matched: [],
      redirectedFrom: undefined,
      meta: {},
    },
  },
  resolve: vi.fn(),
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  hasRoute: vi.fn(),
  getRoutes: vi.fn(() => []),
  isReady: vi.fn(() => Promise.resolve(true)),
  beforeEach: vi.fn(),
  afterEach: vi.fn(),
}

// Global mocks
let localStorageStore: Record<string, string> = {}
let sessionStorageStore: Record<string, string> = {}

beforeEach(() => {
  vi.clearAllMocks()
  localStorageStore = {}
  sessionStorageStore = {}

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => localStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = String(value)
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key]
      }),
      clear: vi.fn(() => {
        localStorageStore = {}
      }),
      key: vi.fn((index: number) => Object.keys(localStorageStore)[index] || null),
      get length() {
        return Object.keys(localStorageStore).length
      },
    },
    writable: true,
    configurable: true,
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => sessionStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        sessionStorageStore[key] = String(value)
      }),
      removeItem: vi.fn((key: string) => {
        delete sessionStorageStore[key]
      }),
      clear: vi.fn(() => {
        sessionStorageStore = {}
      }),
      key: vi.fn((index: number) => Object.keys(sessionStorageStore)[index] || null),
      get length() {
        return Object.keys(sessionStorageStore).length
      },
    },
    writable: true,
    configurable: true,
  })

  // Mock console methods to reduce noise
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

// Configure Vue Test Utils
;(globalThis as any).config = config

// Mock matchMedia for Tailwind responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver for components that use it
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
  configurable: true,
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: IntersectionObserverMock,
  writable: true,
  configurable: true,
})

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockImplementation(() => ({
    getPropertyValue: vi.fn((prop: string) => {
      const styleMap: Record<string, string> = {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
      }
      return styleMap[prop] || ''
    }),
  })),
  writable: true,
  configurable: true,
})

// Export mock router for tests
export { mockRouter }
