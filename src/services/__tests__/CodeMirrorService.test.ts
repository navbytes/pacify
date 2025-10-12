import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { CodeMirror } from '../CodeMirrorService'

// Mock browser environment
const mockMatchMedia = mock(() => ({
  matches: false,
  addEventListener: mock(),
  removeEventListener: mock(),
}))

// Mock DOM elements
const mockContainer = {
  appendChild: mock(),
  removeChild: mock(),
  innerHTML: '',
  isConnected: true,
} as unknown as HTMLElement

const mockEditorView = {
  state: {
    doc: {
      toString: () => 'test content',
      length: 12,
      lines: 1,
      line: (_n: number) => ({ text: 'test content' }),
      sliceString: (_from: number, _to: number) => 'test',
    },
    selection: {
      main: {
        empty: false,
        from: 0,
        to: 4,
        head: 4,
      },
    },
  },
  dom: mockContainer,
  focus: mock(),
  dispatch: mock(),
  destroy: mock(),
}

// Setup browser environment mocks
const setupBrowserMocks = () => {
  ;(global as any).window = {
    matchMedia: mockMatchMedia,
  }
  ;(global as any).document = {
    createElement: mock(() => mockContainer),
  }
}

const cleanupBrowserMocks = () => {
  delete (global as any).window
  delete (global as any).document
}

describe('CodeMirror Service', () => {
  beforeEach(() => {
    setupBrowserMocks()
  })

  afterEach(() => {
    cleanupBrowserMocks()
  })

  describe('canUseCodeMirror', () => {
    it('should return true in browser context', () => {
      expect(CodeMirror.canUseCodeMirror()).toBe(true)
    })

    it('should return false in non-browser context', () => {
      cleanupBrowserMocks()
      expect(CodeMirror.canUseCodeMirror()).toBe(false)
    })
  })

  describe('getCurrentTheme', () => {
    it('should return light theme by default', () => {
      expect(CodeMirror.getCurrentTheme()).toBe('light')
    })

    it('should return dark theme when system prefers dark', () => {
      ;(globalThis as any).window = {
        matchMedia: () => ({
          matches: true,
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
      }

      expect(CodeMirror.getCurrentTheme()).toBe('dark')
    })
  })

  describe('onThemeChange', () => {
    it('should add and remove theme change listeners', () => {
      const listener = () => {}
      const cleanup = CodeMirror.onThemeChange(listener)

      expect(typeof cleanup).toBe('function')

      // Test cleanup
      cleanup()
      // Test passes if no error is thrown
    })
  })

  // Note: These tests would require more complex mocking of CodeMirror internals
  // For now, we test the public API and basic functionality
  describe('editor operations (mocked)', () => {
    it('should handle getValue operation', async () => {
      const result = await CodeMirror.getValue(mockEditorView as any)
      expect(result).toBe('test content')
    })

    it('should handle setValue operation', async () => {
      await CodeMirror.setValue(mockEditorView as any, 'new content')
      // Test passes if no error is thrown
    })

    it('should handle focus operation', async () => {
      await CodeMirror.focus(mockEditorView as any)
      // Test passes if no error is thrown
    })

    it('should handle getSelection operation', async () => {
      const result = await CodeMirror.getSelection(mockEditorView as any)
      expect(result).toBe('test')
    })

    it('should handle setSelection operation', async () => {
      await CodeMirror.setSelection(mockEditorView as any, 0, 4)
      // Test passes if no error is thrown
    })

    it('should handle getCursorPosition operation', async () => {
      const result = await CodeMirror.getCursorPosition(mockEditorView as any)
      expect(result).toBe(4)
    })

    it('should handle setCursorPosition operation', async () => {
      await CodeMirror.setCursorPosition(mockEditorView as any, 5)
      // Test passes if no error is thrown
    })

    it('should handle insertText operation', async () => {
      await CodeMirror.insertText(mockEditorView as any, 'inserted')
      // Test passes if no error is thrown
    })

    it('should handle replaceSelection operation', async () => {
      await CodeMirror.replaceSelection(mockEditorView as any, 'replacement')
      // Test passes if no error is thrown
    })

    it('should handle getLineCount operation', async () => {
      const result = await CodeMirror.getLineCount(mockEditorView as any)
      expect(result).toBe(1)
    })

    it('should handle getLine operation', async () => {
      const result = await CodeMirror.getLine(mockEditorView as any, 0)
      expect(result).toBe('test content')
    })

    it('should handle updateTheme operation', async () => {
      // This would require the theme compartment to be set up
      await CodeMirror.updateTheme(mockEditorView as any, 'dark')
      // Test passes if no error is thrown
    })

    it('should handle dispose operation', async () => {
      await CodeMirror.dispose(mockEditorView as any)
      // Test passes if no error is thrown
    })
  })

  describe('error handling', () => {
    it('should handle operations gracefully when editor is null', async () => {
      const result = await CodeMirror.getValue(null as any)
      expect(result).toBe('')
    })

    it('should handle operations gracefully in non-browser context', async () => {
      cleanupBrowserMocks()

      const result = await CodeMirror.getValue(mockEditorView as any)
      expect(result).toBe('')
    })
  })
})
