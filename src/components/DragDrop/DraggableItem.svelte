<script lang="ts">
import type { ListViewType } from '@/interfaces'
import { dragPatterns } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

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

  // Create or get drag ghost element
  let dragGhost = document.getElementById('drag-ghost')
  if (!dragGhost) {
    dragGhost = document.createElement('div')
    dragGhost.id = 'drag-ghost'
    dragGhost.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        padding: 12px 16px;
        border-radius: 8px;
        border-left: 4px solid;
        background: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
        font-size: 14px;
        font-weight: 600;
        opacity: 0.95;
        pointer-events: none;
        z-index: 9999;
        transform: rotate(2deg);
      `
    document.body.appendChild(dragGhost)
  }

  // Update drag ghost appearance
  const item = event.currentTarget as HTMLElement
  const color = item.dataset.color || '#3B82F6'

  dragGhost.style.borderLeftColor = color
  dragGhost.textContent = `📦 ${name}`
  dragGhost.style.display = 'block'

  // Set the drag image
  event.dataTransfer.setDragImage(dragGhost, 20, 20)

  // Restore position after browser captures the image
  setTimeout(() => {
    if (dragGhost) dragGhost.style.display = 'none'
  }, 0)
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
  class={cn(
    dragPatterns.draggable,
    dragType && dragType !== '' && dragPatterns.dragging,
    disabled && dataType !== 'POPUP' && 'cursor-not-allowed opacity-50'
  )}
  draggable={!disabled}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  role="button"
  tabindex="0"
>
  {@render children?.()}
</div>
