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
  let isDragOver = $state(false)

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

      isDragOver = true
      if (onDragEnter) {
        onDragEnter(event)
      }
    } catch (error) {
      isDragOver = true
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
      isDragOver = false
      if (onDragLeave) {
        onDragLeave(event)
      }
    }
  }

  function handleDrop(event: DragEvent) {
    if (disabled) return

    event.preventDefault()
    isDragOver = false

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
  class="drop-target{disabled ? ' disabled' : ''}{isDragOver ? ' drag-over' : ''}"
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
    transition: all 0.3s ease-in-out;
  }

  .drop-target.drag-over {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.05);
    transform: scale(1.01);
    box-shadow:
      0 0 0 3px rgba(59, 130, 246, 0.1),
      0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .drop-target.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
