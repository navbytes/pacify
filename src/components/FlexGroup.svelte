<script lang="ts">
  // Type definitions - moved from module context to regular script
  type SpacingSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  type AlignItems = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  type JustifyContent =
    | 'start'
    | 'center'
    | 'end'
    | 'between'
    | 'around'
    | 'evenly'
  type Direction = 'horizontal' | 'vertical'

  interface Props {
    classes?: string
    direction?: Direction
    childrenGap?: SpacingSize
    alignItems?: AlignItems
    justifyContent?: JustifyContent
    children?: () => any
  }

  const {
    classes = '',
    direction = 'horizontal',
    childrenGap = 'md',
    alignItems = 'center',
    justifyContent = 'start',
    children,
  }: Props = $props()

  // Map constants remain the same
  const spacingMap: Record<SpacingSize, string> = {
    xxs: 'gap-1',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    xxl: 'gap-10',
  }

  const justifyMap: Record<JustifyContent, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }

  const alignMap: Record<AlignItems, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  }

  // Computed classes using $derived
  const directionClass = $derived(
    direction === 'horizontal' ? 'flex-row' : 'flex-col'
  )
  const gapClass = $derived(spacingMap[childrenGap])
  const justifyClass = $derived(justifyMap[justifyContent])
  const alignClass = $derived(alignMap[alignItems])

  const flexGroupClasses = $derived(
    `flex ${directionClass} ${gapClass} ${justifyClass} ${alignClass} ${classes}`.trim()
  )
</script>

<div class={flexGroupClasses}>
  {@render children?.()}
</div>
