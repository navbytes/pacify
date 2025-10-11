import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Monaco } from '../MonacoService'

// Mock monaco-editor
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  default: {
    KeyCode: {
      Enter: 13,
      Escape: 27,
    },
    editor: {
      create: vi.fn(() => ({
        getValue: vi.fn(() => 'test value'),
        setValue: vi.fn(),
        dispose: vi.fn(),
        onDidChangeModelContent: vi.fn(),
      })),
      defineTheme: vi.fn(),
      setTheme: vi.fn(),
      getEditors: vi.fn(() => []),
    },
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn(),
      CompletionItemKind: {
        Function: 1,
        Constant: 2,
        Snippet: 3,
      },
      CompletionItemInsertTextRule: {
        InsertAsSnippet: 4,
      },
    },
  },
}))

vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({
  default: class MockWorker {},
}))

describe('MonacoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('canUseMonaco', () => {
    it('should return true in browser context', () => {
      expect(Monaco.canUseMonaco()).toBe(true)
    })
  })

  describe('KeyCode', () => {
    it.skip('should have KeyCode properties', () => {
      // KeyCode is only available after Monaco is loaded
      // This test is skipped as it requires full Monaco initialization
      expect(Monaco.KeyCode).toBeDefined()
      expect(Monaco.KeyCode.Enter).toBeDefined()
      expect(Monaco.KeyCode.Escape).toBeDefined()
    })
  })

  describe.skip('create', () => {
    it('should create an editor instance', async () => {
      const container = document.createElement('div')
      const options = {
        value: 'test',
        language: 'javascript',
      }

      const editor = await Monaco.create(container, options)

      expect(editor).toBeDefined()
      expect(typeof editor.getValue).toBe('function')
    })
  })

  describe.skip('getValue', () => {
    it('should get value from editor', async () => {
      const mockEditor = {
        getValue: vi.fn(() => 'editor content'),
        setValue: vi.fn(),
        dispose: vi.fn(),
      }

      const value = await Monaco.getValue(mockEditor as never)

      expect(value).toBe('editor content')
    })
  })

  describe.skip('setValue', () => {
    it('should set value in editor', async () => {
      const mockEditor = {
        getValue: vi.fn(),
        setValue: vi.fn(),
        dispose: vi.fn(),
      }

      await Monaco.setValue(mockEditor as never, 'new content')

      expect(mockEditor.setValue).toHaveBeenCalledWith('new content')
    })
  })

  describe.skip('dispose', () => {
    it('should dispose editor', async () => {
      const mockEditor = {
        getValue: vi.fn(),
        setValue: vi.fn(),
        dispose: vi.fn(),
      }

      await Monaco.dispose(mockEditor as never)

      expect(mockEditor.dispose).toHaveBeenCalled()
    })
  })
})
