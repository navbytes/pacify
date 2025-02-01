<script lang="ts">
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import { ERROR_TYPES, type PACScript, type ListViewType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import { NotifyService } from '@/services/NotifyService'
  import { Check, Circle, Pencil, Trash } from 'lucide-svelte'
  import Button from './Button.svelte'

  interface Props {
    script: PACScript
    pageType?: ListViewType
    onScriptEdit: (scriptId: string) => void
  }

  let { script, pageType = 'POPUP', onScriptEdit }: Props = $props()

  async function handleScriptToggle(scriptId: string, isActive: boolean) {
    await settingsStore.proxyToggle(scriptId, isActive)
  }

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    onScriptEdit(scriptId)
  }

  async function handleScriptDelete(scriptId: string) {
    if (confirm('Are you sure you want to delete this script?')) {
      await settingsStore.deletePACScript(scriptId)
    }
  }

  function handleDragLeave() {
    if (pageType === 'POPUP') return
    document
      .getElementById('options-container')
      ?.setAttribute('data-page-type', '')

    const dragIcon = document.getElementById('drag-image')
    if (dragIcon) {
      dragIcon.style.display = 'none'
      dragIcon.style.backgroundColor = script.color
      dragIcon.textContent = ''
    }
  }

  function dragStartHandler(ev: any) {
    if (!ev.dataTransfer || pageType === 'POPUP') return

    try {
      const id = `${pageType}${dragDelim}${script.id}`
      ev.dataTransfer.setData('text/plain', id)

      ev.dataTransfer.effectAllowed = 'move'

      document
        .getElementById('options-container')
        ?.setAttribute('data-page-type', pageType)

      // Set a custom drag image
      const dragIcon = document.getElementById('drag-image')
      if (dragIcon) {
        dragIcon.style.backgroundColor = script.color
        dragIcon.textContent = script.name
        dragIcon.style.display = 'block'
      }
      ev.dataTransfer.setDragImage(dragIcon, 0, 0)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.DRAG_START, error)
    }
  }
</script>

<div
  class={`
    flex items-center justify-between p-3 
    rounded-lg bg-white dark:bg-gray-800 
    border border-gray-200 dark:border-gray-700
    ${pageType === 'QUICK_SWITCH' ? 'border-dashed' : 'border-solid'}
    ${pageType === 'POPUP' ? '' : 'cursor-grab hover:bg-gray-50 dark:hover:bg-gray-700'}
  `}
  style={`--script-color: ${script.color}`}
  draggable={pageType === 'POPUP' ? 'false' : 'true'}
  ondragstart={dragStartHandler}
  ondragexit={handleDragLeave}
  ondragend={handleDragLeave}
  role="button"
  tabindex="0"
>
  <div class="flex items-center gap-2">
    <div class="text-[var(--script-color)]">
      {#if script.isActive}
        <Check />
      {:else}
        <Circle />
      {/if}
    </div>
    <span class="text-sm">{script.name}</span>
  </div>

  <div class="flex items-center gap-2">
    {#if pageType === 'POPUP'}
      <ToggleSwitch
        checked={script.isActive}
        onchange={(checked) => handleScriptToggle(script.id, checked)}
      />
    {:else if pageType === 'OPTIONS'}
      <Button color="primary" minimal on:click={() => openEditor(script.id)}
        ><Pencil /></Button
      >
      <Button
        color="error"
        minimal
        on:click={() => handleScriptDelete(script.id)}><Trash /></Button
      >
    {/if}
  </div>
</div>
