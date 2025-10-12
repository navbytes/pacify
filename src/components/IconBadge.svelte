<script lang="ts">
  import type { ComponentType } from 'svelte'

  type BadgeColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange'
  type BadgeSize = 'sm' | 'md' | 'lg'

  interface Props {
    icon: ComponentType
    color?: BadgeColor
    size?: BadgeSize
    classes?: string
  }

  let { icon: Icon, color = 'blue', size = 'md', classes = '' }: Props = $props()

  const colorClasses: Record<BadgeColor, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  const sizeClasses: Record<BadgeSize, { container: string; icon: number }> = {
    sm: { container: 'w-8 h-8', icon: 16 },
    md: { container: 'w-10 h-10', icon: 20 },
    lg: { container: 'w-16 h-16', icon: 32 },
  }

  const containerClass = $derived(sizeClasses[size].container)
  const iconSize = $derived(sizeClasses[size].icon)
  const colorClass = $derived(colorClasses[color])
</script>

<div class="rounded-lg flex items-center justify-center {containerClass} {colorClass} {classes}">
  <Icon size={iconSize} />
</div>
