<script lang="ts">
  import { cn } from '@/utils/cn'
  import { flexGroupVariants, type VariantProps } from '@/utils/classPatterns'

  type FlexGroupVariant = VariantProps<typeof flexGroupVariants>

  interface Props {
    classes?: string
    direction?: FlexGroupVariant['direction']
    childrenGap?: FlexGroupVariant['childrenGap']
    alignItems?: FlexGroupVariant['alignItems']
    justifyContent?: FlexGroupVariant['justifyContent']
    children?: () => any
    role?: string
  }

  const {
    classes = '',
    direction = 'horizontal',
    childrenGap = 'md',
    alignItems = 'center',
    justifyContent = 'start',
    children,
    role,
  }: Props = $props()

  const flexGroupClasses = $derived(
    cn(
      flexGroupVariants({
        direction,
        childrenGap,
        alignItems,
        justifyContent,
      }),
      classes
    )
  )
</script>

<div class={flexGroupClasses} {role}>
  {@render children?.()}
</div>
