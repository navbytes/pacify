<script lang="ts">
import type { ComponentType } from 'svelte'
import { iconBadgeVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'

interface Props {
  icon: ComponentType
  color?: 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange'
  size?: 'sm' | 'md' | 'lg'
  classes?: string
}

let { icon: Icon, color = 'blue', size = 'md', classes = '' }: Props = $props()

const iconSizeMap: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 32,
}

const iconSize = $derived(iconSizeMap[size!])
const badgeClasses = $derived(cn(iconBadgeVariants({ color, size }), classes))
</script>

<div class={badgeClasses}>
  <Icon size={iconSize} />
</div>
