<script lang="ts">
  import { ERROR_TYPES, type DropItem } from '@/interfaces'
  import { NotifyService } from '@/services/NotifyService'
  import { I18nService } from '@/services/i18n/i18nService'

  interface Props {
    dropEffect?: 'copy' | 'move' | 'link' | 'none'
    disabled?: boolean
    onDrop?: (item: DropItem) => void
    onDragEnter?: (event: DragEvent) => void
    onDragLeave?: (event: DragEvent) => void
    children?: () => any
  }
  const {
    dropEffect = 'move',
    disabled = false,
    onDrop,
    onDragEnter,
    onDragLeave,
    children,
  }: Props = $props()

  let dropArea = $state<HTMLElement | null>(null)

  function handleDragOver(event: DragEvent) {
    if (disabled) return

    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = dropEffect
    }
  }

  function handleDragEnter(event: DragEvent) {
    if (disabled) return

    try {
      if (!event.dataTransfer?.types.includes('text/plain')) return

      if (onDragEnter) {
        onDragEnter(event)
      }
    } catch (error) {
      if (onDragEnter) {
        onDragEnter(event)
      }
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (disabled) return

    // Only count it as a leave if we're leaving the entire drop target
    // not just moving within it
    if (event.target === dropArea) {
      if (onDragLeave) {
        onDragLeave(event)
      }
    }
  }

  function handleDrop(event: DragEvent) {
    if (disabled) return

    event.preventDefault()

    try {
      const data = event.dataTransfer?.getData('text/plain')
      if (!data) return

      const [dataType, dataId] = data.split('__') || []

      if (!dataType || !dataId) return

      if (onDrop) {
        onDrop({ dataType, dataId })
      }
    } catch (error) {
      NotifyService.error(ERROR_TYPES.DROP, error)
    }
  }
</script>

<div
  bind:this={dropArea}
  class="drop-target{disabled ? ' disabled' : ''}"
  role="region"
  aria-label={I18nService.getMessage('dropTarget')}
  ondragover={handleDragOver}
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  {@render children?.()}
</div>

<style>
  .drop-target {
    position: relative;
    border: 2px dashed transparent;
    transition: all 0.2s ease-in-out;
  }

  .drop-target.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
