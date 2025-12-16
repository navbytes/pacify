<script lang="ts">
  import { cn } from '@/utils/cn'
  import { loadingSpinnerVariants, type VariantProps } from '@/utils/classPatterns'

  type LoadingSpinnerVariant = VariantProps<typeof loadingSpinnerVariants>

  interface Props {
    size?: LoadingSpinnerVariant['size']
    color?: string
  }

  let { size = 'md', color = 'text-blue-500' }: Props = $props()
</script>

<div class="flex justify-center items-center">
  <div class={cn(loadingSpinnerVariants({ size }), color)}></div>
</div>
