<script lang="ts">
import { type DropItem, ERROR_TYPES } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { NotifyService } from '@/services/NotifyService'
import { dragPatterns } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

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
  class={cn(
    'relative',
    dragPatterns.dropZone,
    isDragOver && dragPatterns.dropZoneActive,
    isDragOver && 'animate-pulse-drop-zone',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
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
@keyframes pulseDropZone {
  0%,
  100% {
    border-color: #3b82f6;
  }
  50% {
    border-color: #60a5fa;
  }
}

.animate-pulse-drop-zone {
  animation: pulseDropZone 1.5s ease-in-out infinite;
}
</style>
