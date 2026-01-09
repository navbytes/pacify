<script lang="ts">
import { onDestroy } from 'svelte'
import { scriptTemplates } from '@/constants/templates'
import type { ICodeMirrorEditor } from '@/interfaces'
import { ERROR_TYPES } from '@/interfaces'
import { CodeMirror } from '@/services/CodeMirrorService'
import { I18nService } from '@/services/i18n/i18nService'
import { NotifyService } from '@/services/NotifyService'
import { inputVariants } from '@/utils/classPatterns'
import { defaultCodeMirrorOptions } from '@/utils/codemirror'
import Button from '../Button.svelte'
import FlexGroup from '../FlexGroup.svelte'
import Text from '../Text.svelte'

let themeCleanup: (() => void) | null = null

interface Props {
  pacUrl?: string
  pacMandatory?: boolean
  editorContent?: string
  updateInterval?: number
  lastFetched?: number
  onRefresh?: () => Promise<void>
}

let {
  pacUrl = $bindable(''),
  pacMandatory = $bindable(false),
  editorContent = $bindable(scriptTemplates.empty),
  updateInterval = $bindable(0),
  lastFetched = $bindable(undefined),
  onRefresh = undefined,
}: Props = $props()

let editor: ICodeMirrorEditor | null = null
let editorContainer = $state<HTMLElement>()
let editorHeight: string = '400px'
let urlError = $state('')
let urlTouched = $state(false)
let isRefreshing = $state(false)

// Format last fetched time
let lastFetchedText = $derived.by(() => {
  if (!lastFetched) return ''
  const date = new Date(lastFetched)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
})

async function handleRefresh() {
  if (!onRefresh || isRefreshing) return
  isRefreshing = true
  try {
    await onRefresh()
  } finally {
    isRefreshing = false
  }
}

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

// Watch for changes to pacUrl and editorContent to create/update editor
$effect(() => {
  // This effect runs when pacUrl or editorContent changes

  if (editorContainer && !editor) {
    // Create editor if it doesn't exist (for both URL and inline modes)
    createEditor()
  } else if (editor && editorContent) {
    // Update editor content when it changes (e.g., when PAC is fetched from URL)
    CodeMirror.setValue(editor, editorContent)
  }
})

async function createEditor() {
  if (editor) return

  try {
    // Detect initial system theme
    const initialTheme = CodeMirror.getCurrentTheme()

    editor = await CodeMirror.create(editorContainer!, {
      ...defaultCodeMirrorOptions,
      value: editorContent,
      language: 'pac',
      theme: initialTheme,
      readOnly: !!pacUrl, // Make read-only when using URL
    })

    // Set up content change listener using MutationObserver for CodeMirror
    const observer = new MutationObserver(async () => {
      if (editor && !pacUrl) {
        // Only update content if not using URL
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

// Editor creation is now handled by $effect, no need for onMount

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
    >
    {#if urlError && urlTouched}
      <Text as="p" size="xs" classes="mt-1 text-red-600 dark:text-red-400">{urlError}</Text>
    {/if}
    {#if pacUrl && !urlError}
      <Text as="p" size="xs" classes="mt-1 text-slate-500 dark:text-slate-400">
        {I18nService.getMessage('pacUrlHelp') || 'PAC script will be loaded from this URL'}
      </Text>
    {/if}
  </div>

  {#if pacUrl && !urlError}
    <div class="space-y-3">
      <FlexGroup direction="horizontal" childrenGap="md" alignItems="center">
        <div class="flex-1">
          <label
            for="updateInterval"
            class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            {I18nService.getMessage('updateInterval') || 'Auto-update interval'}
          </label>
          <select
            id="updateInterval"
            bind:value={updateInterval}
            class={inputVariants({ state: 'default', size: 'md' })}
          >
            <option value={0}>{I18nService.getMessage('noAutoUpdate') || 'No auto-update'}</option>
            <option value={15}>15 {I18nService.getMessage('minutes') || 'minutes'}</option>
            <option value={30}>30 {I18nService.getMessage('minutes') || 'minutes'}</option>
            <option value={60}>1 {I18nService.getMessage('hour') || 'hour'}</option>
            <option value={180}>3 {I18nService.getMessage('hours') || 'hours'}</option>
            <option value={360}>6 {I18nService.getMessage('hours') || 'hours'}</option>
            <option value={720}>12 {I18nService.getMessage('hours') || 'hours'}</option>
            <option value={1440}>24 {I18nService.getMessage('hours') || 'hours'}</option>
          </select>
        </div>
        <div class="flex flex-col items-end gap-1" style="margin-top: 1.5rem;">
          <Button color="primary" onclick={handleRefresh} disabled={isRefreshing}>
            {#if isRefreshing}
              {I18nService.getMessage('refreshing') || 'Refreshing...'}
            {:else}
              {I18nService.getMessage('refreshNow') || 'Refresh now'}
            {/if}
          </Button>
          {#if lastFetchedText}
            <Text size="xs" classes="text-slate-500 dark:text-slate-400">
              {I18nService.getMessage('lastFetched') || 'Last fetched'}: {lastFetchedText}
            </Text>
          {/if}
        </div>
      </FlexGroup>
    </div>
  {/if}

  <div class="flex-1 min-h-0">
    {#if !pacUrl}
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
    {:else}
      <label
        for="editorContainer"
        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {I18nService.getMessage('pacScriptPreview') || 'PAC Script Preview (Read-only)'}
      </label>
    {/if}
    <div
      id="editorContainer"
      bind:this={editorContainer}
      class="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden"
      style="height: {editorHeight}"
    ></div>
  </div>

  <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
    <input
      type="checkbox"
      id="pacMandatory"
      bind:checked={pacMandatory}
      class="rounded border-slate-300 text-primary focus:ring-primary"
    >
    <label for="pacMandatory" class="text-sm text-slate-700 dark:text-slate-300">
      {I18nService.getMessage('mandatoryPacScript')}
    </label>
  </FlexGroup>
</div>
