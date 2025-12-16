<script lang="ts">
  import type { ComponentType } from 'svelte'
  import { cn } from '@/utils/cn'
  import { iconBadgeVariants, type VariantProps } from '@/utils/classPatterns'

  type IconBadgeVariant = VariantProps<typeof iconBadgeVariants>

  interface Props {
    icon: ComponentType
    color?: IconBadgeVariant['color']
    size?: IconBadgeVariant['size']
    classes?: string
  }

  let { icon: Icon, color = 'blue', size = 'md', classes = '' }: Props = $props()

  const iconSizeMap = {
    sm: 16,
    md: 20,
    lg: 32,
  }

  const iconSize = $derived(iconSizeMap[size])
  const badgeClasses = $derived(cn(iconBadgeVariants({ color, size }), classes))
</script>

<div class={badgeClasses}>
  <Icon size={iconSize} />
</div>
