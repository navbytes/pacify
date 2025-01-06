<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import EditIcon from '@/icons/EditIcon.svelte'
  import TrashIcon from '@/icons/TrashIcon.svelte'
  import { ERROR_TYPES, type PACScript, type PageType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import { NotifyService } from '@/services/NotifyService'

  type ScriptEditEvent = {
    scriptId: string
  }

  // Create a typed dispatch
  const dispatch = createEventDispatcher<{
    handleScriptEdit: ScriptEditEvent
  }>()

  export let script: PACScript
  export let pageType: PageType = 'POPUP'

  async function handleScriptToggle(scriptId: string, isActive: boolean) {
    await settingsStore.proxyToggle(scriptId, isActive)
  }

  function openEditor(scriptId?: string) {
    if (!scriptId) return
    dispatch('handleScriptEdit', { scriptId })
  }

  async function handleScriptDelete(scriptId: string) {
    if (confirm('Are you sure you want to delete this script?')) {
      await settingsStore.deletePACScript(scriptId)
    }
  }

  const borderColor = script.isActive ? script.color : 'transparent'
  const borderStyle =
    pageType === 'QUICK_SWITCH'
      ? `border: 1px dashed ${script.color}`
      : `border-left: 4px solid ${borderColor};`

  function handleDragLeave() {
    if (pageType === 'POPUP') return
    document
      .getElementById('options-container')
      ?.setAttribute('data-page-type', '')
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
      }
      ev.dataTransfer.setDragImage(dragIcon, 0, 0)
    } catch (error) {
      NotifyService.error(ERROR_TYPES.DRAG_START, error)
    }
  }
</script>

<div
  class={`script-item ${pageType}`}
  style={borderStyle}
  draggable={pageType === 'POPUP' ? 'false' : 'true'}
  on:dragstart={dragStartHandler}
  on:dragexit={handleDragLeave}
  on:dragend={handleDragLeave}
  role="button"
  tabindex="0"
>
  <div class="script-color" style="background-color: {script.color};"></div>
  <div class="script-name">
    {script.name}
  </div>
  <div class="script-actions">
    {#if pageType === 'POPUP'}
      <ToggleSwitch
        checked={script.isActive}
        on:change={(e) => handleScriptToggle(script.id, e.detail.checked)}
      />
    {:else if pageType === 'OPTIONS'}
      <button
        class="icon-button edit-script"
        on:click={() => openEditor(script.id)}
      >
        <EditIcon />
      </button>
      <button
        class="icon-button danger delete-script"
        on:click={() => handleScriptDelete(script.id)}
      >
        <TrashIcon />
      </button>
    {/if}
  </div>
</div>

<style>
  @import '../styles/script-item.css';
</style>
