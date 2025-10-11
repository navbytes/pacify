<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Monaco } from '@/services/MonacoService'
  import type { IMonacoEditor } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { ERROR_TYPES } from '@/interfaces'
  import FlexGroup from '../FlexGroup.svelte'
  import { scriptTemplates } from '@/constants/templates'
  import Button from '../Button.svelte'
  import { I18nService } from '@/services/i18n/i18nService'
  import { defaultOptions } from '@/utils/monaco'
  import Text from '../Text.svelte'

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

  let editor: IMonacoEditor | null = null
  let editorContainer = $state<HTMLElement>()
  let editorHeight: string = '400px'

  function setTemplate(template: string) {
    editorContent = template
    if (editor) {
      editor.setValue(template)
    }
  }

  onMount(async () => {
    if (!pacUrl) {
      try {
        editor = await Monaco.create(editorContainer, {
          ...defaultOptions,
          value: editorContent,
        })

        // Set up content change listener
        editor.onDidChangeModelContent(() => {
          editorContent = editor.getValue()
        })
      } catch (error) {
        NotifyService.error(ERROR_TYPES.EDITOR, error)
      }
    }
  })

  onDestroy(() => {
    if (editor) {
      editor.dispose()
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
      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
             focus:ring-2 focus:ring-primary focus:border-primary"
      placeholder="https://example.com/proxy.pac"
    />
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
