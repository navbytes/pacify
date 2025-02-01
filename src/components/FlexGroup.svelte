<script context="module" lang="ts">
  // Define types for spacing sizes and alignment options.
  export type SpacingSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  export type AlignItems = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  export type JustifyContent =
    | 'start'
    | 'center'
    | 'end'
    | 'between'
    | 'around'
    | 'evenly'
  export type Direction = 'horizontal' | 'vertical'
</script>

<script lang="ts">
  // Props
  // rowDirection: horizontal or vertical layout.
  export let direction: Direction = 'horizontal'
  // childrenGap: spacing between child elements.
  export let childrenGap: SpacingSize = 'md'
  // alignItems: controls the cross-axis alignment.
  export let alignItems: AlignItems = 'center'
  // justifyContent: controls the main-axis alignment.
  export let justifyContent: JustifyContent = 'start'

  // Map the spacing size to Tailwind gap classes.
  const spacingMap: Record<SpacingSize, string> = {
    xxs: 'gap-1',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    xxl: 'gap-10',
  }

  // Map justifyContent options to Tailwind classes.
  const justifyMap: Record<JustifyContent, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }

  // Map alignItems options to Tailwind classes.
  const alignMap: Record<AlignItems, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  }

  // Compute the Tailwind classes based on the provided props.
  $: directionClass = direction === 'horizontal' ? 'flex-row' : 'flex-col'
  $: gapClass = spacingMap[childrenGap]
  $: justifyClass = justifyMap[justifyContent]
  $: alignClass = alignMap[alignItems]

  $: flexGroupClasses = `flex ${directionClass} ${gapClass} ${justifyClass} ${alignClass}`
</script>

<div class={flexGroupClasses}>
  <slot />
</div>
