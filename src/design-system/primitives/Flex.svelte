<script lang="ts">
/**
 * Flex - Flexbox Layout Component
 *
 * Enhanced version of FlexGroup with design tokens.
 * Provides declarative flexbox layouts with spacing and alignment control.
 *
 * @example
 * <Flex direction="row" gap="sm" align="center" justify="between">
 *   <span>Left</span>
 *   <Button>Right</Button>
 * </Flex>
 */

import type { BorderRadius, Shadow, Spacing } from '../tokens'
import { borderRadius, shadows } from '../tokens'
import { cn, getBgClass, getBorderClass, getHoverBgClass, getSpacingClass } from '../utils'

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
    | 'ul'
    | 'ol'
    | 'li'

  // Flexbox properties
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  gap?: Spacing
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean | 'reverse'

  // Padding (inherited from Box)
  p?: Spacing
  px?: Spacing
  py?: Spacing
  pt?: Spacing
  pr?: Spacing
  pb?: Spacing
  pl?: Spacing

  // Margin (inherited from Box)
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
  direction = 'row',
  gap,
  align,
  justify,
  wrap = false,
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

// Map align values to Tailwind classes
const alignMap: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

// Map justify values to Tailwind classes
const justifyMap: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

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
    'flex',
    `flex-${direction}`,
    gap && getSpacingClass('gap', gap),
    align && alignMap[align],
    justify && justifyMap[justify],
    wrap === true && 'flex-wrap',
    wrap === 'reverse' && 'flex-wrap-reverse',
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
