<script lang="ts">
  /**
   * Box - Universal Container Component
   *
   * The most primitive layout component. Can render as any HTML element
   * with complete control over spacing, colors, borders, and more.
   *
   * @example
   * <Box p="md" bg="white" borderRadius="lg" border>
   *   Content here
   * </Box>
   */

  import type { Spacing, BorderRadius, Shadow } from '../tokens'
  import { borderRadius, shadows } from '../tokens'
  import { cn, getSpacingClass, getBgClass, getBorderClass, getHoverBgClass } from '../utils'

  interface Props {
    // Element type
    as?:
      | 'div'
      | 'section'
      | 'article'
      | 'header'
      | 'footer'
      | 'main'
      | 'aside'
      | 'nav'
      | 'h1'
      | 'h2'
      | 'h3'
      | 'h4'
      | 'h5'
      | 'h6'
      | 'p'
      | 'span'

    // Padding
    p?: Spacing
    px?: Spacing
    py?: Spacing
    pt?: Spacing
    pr?: Spacing
    pb?: Spacing
    pl?: Spacing

    // Margin
    m?: Spacing
    mx?: Spacing
    my?: Spacing
    mt?: Spacing
    mr?: Spacing
    mb?: Spacing
    ml?: Spacing

    // Background
    bg?: string

    // Border
    border?: boolean
    borderColor?: string
    borderWidth?: '0' | '1' | '2' | '4'
    borderStyle?: 'solid' | 'dashed' | 'dotted'
    borderSide?: 'top' | 'right' | 'bottom' | 'left' | 'all'
    borderRadius?: BorderRadius

    // Shadow
    shadow?: Shadow

    // Layout
    width?: string
    height?: string
    minWidth?: string
    minHeight?: string
    maxWidth?: string
    maxHeight?: string

    // Position
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'

    // Display
    display?:
      | 'block'
      | 'inline-block'
      | 'inline'
      | 'flex'
      | 'inline-flex'
      | 'grid'
      | 'inline-grid'
      | 'hidden'

    // Overflow
    overflow?: 'auto' | 'hidden' | 'visible' | 'scroll'
    overflowX?: 'auto' | 'hidden' | 'visible' | 'scroll'
    overflowY?: 'auto' | 'hidden' | 'visible' | 'scroll'

    // Cursor
    cursor?: 'pointer' | 'default' | 'not-allowed' | 'wait' | 'text'

    // Hover state
    hover?: {
      bg?: string
    }

    // Additional custom classes
    className?: string

    // HTML attributes
    role?: string
    tabindex?: number
    style?: string

    // Children snippet (Svelte 5)
    children?: import('svelte').Snippet
  }

  let {
    as = 'div',
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    bg,
    border = false,
    borderColor,
    borderWidth = '1',
    borderStyle = 'solid',
    borderSide = 'all',
    borderRadius: radius,
    shadow,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    position,
    display,
    overflow,
    overflowX,
    overflowY,
    cursor,
    hover,
    className = '',
    role,
    tabindex,
    style,
    children,
  }: Props = $props()

  // Generate padding classes
  const paddingClasses = $derived(
    cn(
      getSpacingClass('p', p),
      getSpacingClass('px', px),
      getSpacingClass('py', py),
      getSpacingClass('pt', pt),
      getSpacingClass('pr', pr),
      getSpacingClass('pb', pb),
      getSpacingClass('pl', pl)
    )
  )

  // Generate margin classes
  const marginClasses = $derived(
    cn(
      getSpacingClass('m', m),
      getSpacingClass('mx', mx),
      getSpacingClass('my', my),
      getSpacingClass('mt', mt),
      getSpacingClass('mr', mr),
      getSpacingClass('mb', mb),
      getSpacingClass('ml', ml)
    )
  )

  // Generate border classes
  const borderClasses = $derived(
    cn(
      border &&
        borderSide === 'all' &&
        `border-${borderWidth === '1' ? '' : borderWidth}`.replace('border-', 'border'),
      border &&
        borderSide === 'top' &&
        `border-t-${borderWidth === '1' ? '' : borderWidth}`.replace('border-t-', 'border-t'),
      border &&
        borderSide === 'right' &&
        `border-r-${borderWidth === '1' ? '' : borderWidth}`.replace('border-r-', 'border-r'),
      border &&
        borderSide === 'bottom' &&
        `border-b-${borderWidth === '1' ? '' : borderWidth}`.replace('border-b-', 'border-b'),
      border &&
        borderSide === 'left' &&
        `border-l-${borderWidth === '1' ? '' : borderWidth}`.replace('border-l-', 'border-l'),
      border && borderStyle !== 'solid' && `border-${borderStyle}`,
      border && borderColor && getBorderClass(borderColor)
    )
  )

  // Combine all classes
  const computedClasses = $derived(
    cn(
      paddingClasses,
      marginClasses,
      bg && getBgClass(bg),
      borderClasses,
      radius && borderRadius[radius],
      shadow && shadows[shadow],
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      position,
      display,
      overflow && `overflow-${overflow}`,
      overflowX && `overflow-x-${overflowX}`,
      overflowY && `overflow-y-${overflowY}`,
      cursor && `cursor-${cursor}`,
      hover?.bg && getHoverBgClass(hover.bg),
      className
    )
  )
</script>

<svelte:element this={as} class={computedClasses} {role} {tabindex} {style}>
  {@render children?.()}
</svelte:element>
