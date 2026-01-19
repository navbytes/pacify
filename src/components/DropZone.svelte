<script lang="ts">
import type { DropItem } from '@/interfaces'
import { dropZoneOverlayVariants, dropZoneSectionVariants } from '@/utils/classPatterns'
import DropTarget from './DragDrop/DropTarget.svelte'
import Text from './Text.svelte'

interface Props {
  color?: 'blue' | 'red' | 'slate'
  overlayMessage: string
  overlayTextColor?: string
  pageType: string
  dragType?: string
  onDrop: (item: DropItem) => void | Promise<void>
  children?: import('svelte').Snippet
}

let {
  color = 'blue',
  overlayMessage,
  overlayTextColor,
  pageType,
  dragType = $bindable(),
  onDrop,
  children,
}: Props = $props()

// Map color to default text color if not provided
const defaultTextColors = {
  blue: 'text-blue-700 dark:text-blue-300',
  red: 'text-red-700 dark:text-red-300',
  slate: 'text-slate-700 dark:text-slate-300',
} as const

const textColor = $derived(overlayTextColor || defaultTextColors[color])
</script>

<DropTarget {onDrop}>
  <section
    data-drag-type={dragType}
    data-page-type={pageType}
    class={dropZoneSectionVariants({ color })}
  >
    <div class="relative rounded-lg transition-colors">
      <!-- Overlay shown during drag -->
      <div class={dropZoneOverlayVariants({ color })} data-overlay>
        <Text as="p" size="xl" weight="medium" classes={textColor}>{overlayMessage}</Text>
      </div>

      <!-- Content slot -->
      {#if children}
        {@render children()}
      {/if}
    </div>
  </section>
</DropTarget>
