<script lang="ts">
  type TextElement = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'

  import type { Snippet } from 'svelte'
  import { cn } from '@/utils/cn'
  import { textVariants, type VariantProps } from '@/utils/classPatterns'

  type TextVariant = VariantProps<typeof textVariants>

  interface Props {
    as?: TextElement
    size?: TextVariant['size']
    weight?: TextVariant['weight']
    color?: TextVariant['color']
    classes?: string
    truncate?: boolean
    italic?: boolean
    underline?: boolean
    children?: Snippet
    id?: string
  }

  const {
    as = 'span',
    size = 'base',
    weight = 'normal',
    color = 'primary',
    classes = '',
    truncate = false,
    italic = false,
    underline = false,
    children,
    id = undefined,
  }: Props = $props()

  const combinedClasses = $derived(
    cn(
      textVariants({
        size,
        weight,
        color,
        truncate,
        italic,
        underline,
      }),
      classes
    )
  )
</script>

{#if as === 'p'}
  <p class={combinedClasses} {id}>
    {@render children?.()}
  </p>
{:else if as === 'h1'}
  <h1 class={combinedClasses} {id}>
    {@render children?.()}
  </h1>
{:else if as === 'h2'}
  <h2 class={combinedClasses} {id}>
    {@render children?.()}
  </h2>
{:else if as === 'h3'}
  <h3 class={combinedClasses} {id}>
    {@render children?.()}
  </h3>
{:else if as === 'h4'}
  <h4 class={combinedClasses} {id}>
    {@render children?.()}
  </h4>
{:else if as === 'h5'}
  <h5 class={combinedClasses} {id}>
    {@render children?.()}
  </h5>
{:else if as === 'h6'}
  <h6 class={combinedClasses} {id}>
    {@render children?.()}
  </h6>
{:else if as === 'label'}
  <label class={combinedClasses} {id}>
    {@render children?.()}
  </label>
{:else}
  <span class={combinedClasses} {id}>
    {@render children?.()}
  </span>
{/if}
