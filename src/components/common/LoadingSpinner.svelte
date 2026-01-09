<script lang="ts">
import { loadingSpinnerVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

let { size = 'md', color = 'text-blue-500' }: Props = $props()
</script>

<div class="flex justify-center items-center">
  <div class={cn(loadingSpinnerVariants({ size }), color)}></div>
</div>
