<script lang="ts">
  import type { PACScript } from '@/interfaces'
  import { Monaco } from '@/services/MonacoService'
  import { ERROR_TYPES } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { onMount, onDestroy } from 'svelte'
  import { blur } from 'svelte/transition'
  // import { Maximize2, Minimize2 } from 'lucide-svelte'
  import ToggleSwitch from './ToggleSwitch.svelte'
  import Button from './Button.svelte'
  import LabelButton from './LabelButton.svelte'

  interface Props {
    script?: PACScript
    onSave: (script: Omit<PACScript, 'id'>) => void
    onCancel: () => void
  }

  let { script = undefined, onSave, onCancel }: Props = $props()

  let name = $state(script?.name || '')
  let editorContent = $state(script?.script || '')
  let color = $state(script?.color || 'gray')
  let isActive = $state(script?.isActive || false)
  let editor: any = $state(null)
  let isFullscreen = $state(false)
  let editorContainer: HTMLElement

  // Create a derived value
  let editorHeight = $derived(isFullscreen ? 'calc(100vh - 280px)' : '400px')

  let errorMessage = $state('')
  let isSubmitting = $state(false)

  onMount(async () => {
    try {
      editor = await Monaco.create(editorContainer, {
        value: editorContent,
        language: 'pac', // Changed from 'javascript' to 'pac' since we're using PAC script
        theme: 'pac-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        tabSize: 2,
      })

      editor.onDidChangeModelContent(() => {
        editorContent = editor.getValue()
      })

      // Handle ESC key for exiting fullscreen
      editor.addCommand(Monaco.KeyCode.Escape, () => {
        if (isFullscreen) {
          toggleFullscreen()
        }
      })
    } catch (error) {
      NotifyService.error(ERROR_TYPES.EDITOR, error)
    }
  })

  onDestroy(() => {
    if (editor) {
      editor.dispose()
    }
  })

  function toggleFullscreen() {
    isFullscreen = !isFullscreen
    if (editor) {
      // Trigger editor layout update after animation
      setTimeout(() => {
        editor.layout()
      }, 300)
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return
    errorMessage = ''

    if (!name.trim()) {
      errorMessage = 'Name is required'
      return
    }

    if (!editorContent.trim()) {
      errorMessage = 'Script content is required'
      return
    }

    try {
      isSubmitting = true

      await onSave({
        name: name.trim(),
        color,
        isActive,
        script: editorContent.trim(),
        quickSwitch: script?.quickSwitch || false,
      })
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : 'Invalid script content'
      NotifyService.error(ERROR_TYPES.VALIDATION, error)
    } finally {
      isSubmitting = false
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isFullscreen) {
      onCancel()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  transition:blur={{ duration: 200 }}
>
  <div
    class={`
      bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col
      transition-all duration-300 ease-in-out
      ${isFullscreen ? 'fixed inset-0 m-0 rounded-none' : 'w-full max-w-4xl max-h-[90vh]'}
    `}
    role="dialog"
    aria-labelledby="editor-title"
  >
    <!-- Header remains the same -->

    <form class="flex flex-col flex-1 overflow-hidden" onsubmit={handleSubmit}>
      <div class="p-4 space-y-4 flex-1 flex flex-col">
        <!-- Script Settings Row -->
        <div class="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name Input -->
          <div>
            <label
              for="scriptName"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Script Name
            </label>
            <input
              type="text"
              id="scriptName"
              bind:value={name}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter script name"
            />
          </div>

          <!-- Color and Active Status -->
          <div class="flex items-center gap-6">
            <!-- Color Picker -->
            <div class="flex-1">
              <span
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Color
              </span>
              <div
                class="relative inline-flex items-center rounded shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={`background-color: ${color}`}
              >
                <LabelButton color="secondary" hideType="invisible" minimal>
                  <span class="relative inline-flex py-2 px-4">&nbsp</span>
                  <input
                    slot="input"
                    type="color"
                    onchange={(e) => (color = e.currentTarget.value)}
                  />
                </LabelButton>
              </div>
            </div>

            <!-- Active Toggle -->
            <div>
              <span
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Active
              </span>
              <ToggleSwitch
                checked={isActive}
                onchange={(value) => (isActive = value)}
              />
            </div>
          </div>
        </div>

        <!-- Monaco Editor -->
        <div class="flex-1 min-h-0">
          <label
            for="editorContainer"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            PAC Script
          </label>
          <div
            id="editorContainer"
            bind:this={editorContainer}
            class="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden"
            style:height={editorHeight}
          ></div>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
          <div class="text-sm text-red-600 dark:text-red-400 flex-shrink-0">
            {errorMessage}
          </div>
        {/if}
      </div>

      <!-- Footer with Actions -->
      <div
        class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
      >
        <Button color="secondary" on:click={onCancel} disabled={isSubmitting}
          >Cancel</Button
        >

        <Button color="primary" type="submit" disabled={isSubmitting}
          >{isSubmitting ? 'Saving...' : 'Save Script'}</Button
        >
      </div>
    </form>
  </div>
</div>

<style lang="postcss">
  :global(body.modal-open) {
    @apply overflow-hidden;
  }

  :global(.monaco-editor) {
    @apply rounded-md overflow-hidden;
  }

  :global(.monaco-editor .margin) {
    @apply bg-gray-100 dark:bg-gray-800;
  }
</style>
