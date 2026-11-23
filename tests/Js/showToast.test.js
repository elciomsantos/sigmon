import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('showToast', () => {
  beforeEach(() => {
    vi.resetModules()
    // No Vitest 5/jsdom, `document` é uma propriedade somente leitura de
    // `window`; use stubGlobal para substituí-la com segurança.
    vi.stubGlobal('window', {})
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      querySelector: vi.fn(),
      createElement: vi.fn(() => ({
        className: '',
        style: {},
        appendChild: vi.fn(),
        insertAdjacentHTML: vi.fn(),
        getElementById: vi.fn(),
      })),
      body: {
        appendChild: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should be defined as a function in ui-utils', async () => {
    await import('../../src/assets/js/utils/ui-utils.ts')

    expect(typeof window.showToast).toBe('function')
  })
})
