<script lang="ts">
  import type { ListViewType } from '@/interfaces'

  interface Props {
    dragstart?: (event: DragEvent) => void
    dragend?: (event: DragEvent) => void
    name: string
    id: string
    dataType: ListViewType
    disabled: boolean
    dragType?: string
    children?: () => any
  }

  let {
    dragstart,
    dragend,
    name,
    id,
    dataType,
    disabled,
    dragType = $bindable(),
    children,
  }: Props = $props()

  function handleDragStart(event: DragEvent) {
    if (disabled || !event.dataTransfer) return

    dragType = dataType
    dragstart && dragstart(event)

    // Set the drag data
    event.dataTransfer.setData('text/plain', `${dataType}__${id}`)
    event.dataTransfer.effectAllowed = 'move'

    // Set a custom drag image if provided
    const dragImage = document.getElementById('drag-image')
    if (dragImage) {
      // Update drag image appearance
      const item = event.currentTarget as HTMLElement
      const color = item.dataset.color || '#666'
      const text = item.querySelector('[data-label]')?.textContent || name

      dragImage.style.backgroundColor = color
      dragImage.textContent = text
      dragImage.style.display = 'block'

      event.dataTransfer.setDragImage(dragImage, 0, 0)
    }
  }

  function handleDragEnd(event: DragEvent) {
    dragType = ''
    dragend && dragend(event)

    // Hide drag image
    const dragImage = document.getElementById('drag-image')
    if (dragImage) {
      dragImage.style.display = 'none'
    }
  }
</script>

<div
  class="draggable-item {!dragType || dragType === ''
    ? ''
    : 'dragging'} {disabled && dataType !== 'POPUP' ? 'disabled' : ''}"
  draggable={!disabled}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  role="button"
  tabindex="0"
>
  {@render children?.()}
</div>

<style>
  .draggable-item {
    cursor: grab;
    transition: opacity 0.2s;
  }

  .draggable-item.dragging {
    opacity: 0.5;
  }

  .draggable-item.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
