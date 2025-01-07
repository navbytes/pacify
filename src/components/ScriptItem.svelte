<script lang="ts">
  import ToggleSwitch from '@/components/ToggleSwitch.svelte'
  import EditIcon from '@/icons/EditIcon.svelte'
  import TrashIcon from '@/icons/TrashIcon.svelte'
  import { ERROR_TYPES, type PACScript, type ListViewType } from '@/interfaces'
  import { settingsStore } from '@/stores/settingsStore'
  import { dragDelim } from '@/constants/app'
  import { NotifyService } from '@/services/NotifyService'
  import CheckIcon from '@/icons/CheckIcon.svelte'

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
  style={`border-color: ${script.color}`}
  draggable={pageType === 'POPUP' ? 'false' : 'true'}
  ondragstart={dragStartHandler}
  ondragexit={handleDragLeave}
  ondragend={handleDragLeave}
  role="button"
  tabindex="0"
>
  <div class="script-color">
    <CheckIcon isActive={script.isActive} color={script.color} size="24" />
  </div>
  <div class="script-name">
    {script.name}
  </div>
  <div class="script-actions">
    {#if pageType === 'POPUP'}
      <ToggleSwitch
        isChecked={script.isActive}
        onToggle={(checked) => handleScriptToggle(script.id, checked)}
      />
    {:else if pageType === 'OPTIONS'}
      <button
        class="icon-button edit-script"
        onclick={() => openEditor(script.id)}
      >
        <EditIcon />
      </button>
      <button
        class="icon-button danger delete-script"
        onclick={() => handleScriptDelete(script.id)}
      >
        <TrashIcon />
      </button>
    {/if}
  </div>
</div>

<style>
  @import '../styles/script-item.css';
</style>
