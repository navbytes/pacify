<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { CodeMirror } from '@/services/CodeMirrorService'
  import type { ICodeMirrorEditor } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import FlexGroup from '../FlexGroup.svelte'
  import { scriptTemplates } from '@/constants/templates'
  import Button from '../Button.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import { defaultCodeMirrorOptions } from '@/utils/codemirror'
  import Text from '../Text.svelte'
  import { inputVariants } from '@/utils/classPatterns'

  let themeCleanup: (() => void) | null = null

  interface Props {
    pacUrl?: string
    pacMandatory?: boolean
    editorContent?: string
  }

  let {
    pacUrl = $bindable(''),
    pacMandatory = $bindable(false),
    editorContent = $bindable(scriptTemplates.empty),
  }: Props = $props()

  let editor: ICodeMirrorEditor | null = null
  let editorContainer = $state<HTMLElement>()
  let editorHeight: string = '400px'
  let urlError = $state('')
  let urlTouched = $state(false)

  // URL validation function
  function validateUrl(value: string): string {
    if (!value.trim()) return ''

    try {
      const url = new URL(value)
      // PAC files are typically served via HTTP/HTTPS
      if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') {
        return (
          I18nService.getMessage('invalidPacUrlProtocol') ||
          'PAC URL must use http://, https://, or file:// protocol'
        )
      }

      // Check for .pac extension (common but not required)
      if (
        !url.pathname.endsWith('.pac') &&
        !url.pathname.endsWith('.js') &&
        !url.pathname.includes('.pac?')
      ) {
        return I18nService.getMessage('pacUrlWarning') || 'PAC files typically end with .pac'
      }

      return ''
    } catch {
      return I18nService.getMessage('invalidUrl') || 'Please enter a valid URL'
    }
  }

  function handleUrlBlur() {
    urlTouched = true
    urlError = validateUrl(pacUrl)
  }

  function handleUrlInput() {
    if (urlTouched) {
      urlError = validateUrl(pacUrl)
    }
  }

  async function setTemplate(template: string) {
    editorContent = template
    if (editor) {
      await CodeMirror.setValue(editor, template)
    }
  }

  onMount(async () => {
    if (!pacUrl) {
      try {
        // Detect initial system theme
        const initialTheme = CodeMirror.getCurrentTheme()

        editor = await CodeMirror.create(editorContainer!, {
          ...defaultCodeMirrorOptions,
          value: editorContent,
          language: 'pac',
          theme: initialTheme,
        })

        // Set up content change listener using MutationObserver for CodeMirror
        const observer = new MutationObserver(async () => {
          if (editor) {
            const newContent = await CodeMirror.getValue(editor)
            if (newContent !== editorContent) {
              editorContent = newContent
            }
          }
        })

        // Observe changes to the editor content
        if (editor.dom) {
          observer.observe(editor.dom, {
            childList: true,
            subtree: true,
            characterData: true,
          })
        }

        // Store observer for cleanup
        ;(editor as any).__observer = observer

        // Listen for theme changes and update editor
        themeCleanup = CodeMirror.onThemeChange(async (newTheme) => {
          if (editor) {
            await CodeMirror.updateTheme(editor, newTheme)
          }
        })
      } catch (error) {
        NotifyService.error(ERROR_TYPES.EDITOR, error)
      }
    }
  })

  onDestroy(async () => {
    // Clean up theme listener
    if (themeCleanup) {
      themeCleanup()
      themeCleanup = null
    }

    if (editor) {
      // Clean up observer
      if ((editor as any).__observer) {
        ;((editor as any).__observer as MutationObserver).disconnect()
      }
      await CodeMirror.dispose(editor)
    }
  })
</script>

<div class="space-y-4">
  <div>
    <label for="pacUrl" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {I18nService.getMessage('pacScriptUrl')}
    </label>
    <input
      type="url"
      id="pacUrl"
      bind:value={pacUrl}
      oninput={handleUrlInput}
      onblur={handleUrlBlur}
      class={inputVariants({ state: urlError && urlTouched ? 'error' : 'default', size: 'md' })}
      placeholder={I18nService.getMessage('pacUrlPlaceholder') || 'http://example.com/proxy.pac'}
    />
    {#if urlError && urlTouched}
      <Text as="p" size="xs" classes="mt-1 text-red-600 dark:text-red-400">
        {urlError}
      </Text>
    {/if}
    {#if pacUrl && !urlError}
      <Text as="p" size="xs" classes="mt-1 text-slate-500 dark:text-slate-400">
        {I18nService.getMessage('pacUrlHelp') || 'PAC script will be loaded from this URL'}
      </Text>
    {/if}
  </div>

  {#if !pacUrl}
    <div class="flex-1 min-h-0">
      <FlexGroup>
        <label
          for="editorContainer"
          class="flex-grow text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {I18nService.getMessage('pacScript')}
        </label>
        <Text size="sm" weight="medium" classes="text-slate-700 dark:text-slate-300">
          {I18nService.getMessage('templates')}
        </Text>
        <Button minimal color="primary" onclick={() => setTemplate(scriptTemplates.empty)}>
          {I18nService.getMessage('emptyTemplate')}
        </Button>
        <Button minimal color="primary" onclick={() => setTemplate(scriptTemplates.basic)}>
          {I18nService.getMessage('basicTemplate')}
        </Button>
        <Button minimal color="primary" onclick={() => setTemplate(scriptTemplates.advanced)}>
          {I18nService.getMessage('advancedTemplate')}
        </Button>
        <Button minimal color="primary" onclick={() => setTemplate(scriptTemplates.pro)}>
          {I18nService.getMessage('proTemplate')}
        </Button>
      </FlexGroup>
      <div
        id="editorContainer"
        bind:this={editorContainer}
        class="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden"
        style="height: {editorHeight}"
      ></div>
    </div>
  {/if}

  <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
    <input
      type="checkbox"
      id="pacMandatory"
      bind:checked={pacMandatory}
      class="rounded border-slate-300 text-primary focus:ring-primary"
    />
    <label for="pacMandatory" class="text-sm text-slate-700 dark:text-slate-300">
      {I18nService.getMessage('mandatoryPacScript')}
    </label>
  </FlexGroup>
</div>
