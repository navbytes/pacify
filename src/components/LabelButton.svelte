<script lang="ts" module>
  import type { ComponentType } from 'svelte'

  export type HideType = 'hidden' | 'invisible'
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import Text from './Text.svelte'
  import { labelButtonVariants, type VariantProps } from '@/utils/classPatterns'

  type LabelButtonVariant = VariantProps<typeof labelButtonVariants>

  interface Props {
    color?: LabelButtonVariant['intent']
    minimal?: boolean
    hideType?: HideType
    icon?: ComponentType | null
    children?: Snippet
    input?: Snippet
  }

  let {
    color = 'primary',
    minimal = false,
    hideType = 'hidden',
    icon = null,
    children,
    input,
  }: Props = $props()

  const labelClasses = $derived(
    labelButtonVariants({
      intent: color,
      variant: minimal ? 'minimal' : 'base',
    })
  )
</script>

<label class={labelClasses}>
  {#if icon}
    {@const Icon = icon}
    <!-- If both an icon and text exist, add margin to the icon -->
    <Text classes={children ? 'mr-2' : ''}>
      <Icon size={18} />
    </Text>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if input}
    <!-- Wrap the input snippet in a hidden span so that it is still part of the DOM,
         but not visible. -->
    <Text classes={hideType}>
      {@render input()}
    </Text>
  {/if}
</label>
