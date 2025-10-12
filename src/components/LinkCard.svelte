<script lang="ts">
  import type { ComponentType } from 'svelte'
  import Card from './Card.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import IconBadge from './IconBadge.svelte'
  import { ExternalLink } from 'lucide-svelte'

  type BadgeColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange'

  interface Props {
    href: string
    icon: ComponentType
    label: string
    color?: BadgeColor
    target?: string
    rel?: string
  }

  let {
    href,
    icon,
    label,
    color = 'blue',
    target = '_blank',
    rel = 'noopener noreferrer',
  }: Props = $props()

  const hoverColorClasses: Record<BadgeColor, string> = {
    blue: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400',
    red: 'group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400',
    yellow:
      'group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
    green:
      'group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400',
    purple:
      'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400',
    orange:
      'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 group-hover:text-orange-600 dark:group-hover:text-orange-400',
  }

  const linkIconColorClasses: Record<BadgeColor, string> = {
    blue: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    red: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    yellow: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
    green: 'group-hover:text-green-600 dark:group-hover:text-green-400',
    purple: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    orange: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
  }
</script>

<a {href} {target} {rel} class="group block">
  <Card
    classes="p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
  >
    <FlexGroup childrenGap="sm" alignItems="center">
      <IconBadge
        {icon}
        {color}
        size="md"
        classes="transition-all duration-200 group-hover:scale-110 {hoverColorClasses[color]}"
      />
      <div class="flex-1 min-w-0">
        <div
          class="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
        >
          {label}
        </div>
      </div>
      <ExternalLink
        size={16}
        class="flex-shrink-0 text-slate-400 dark:text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 {linkIconColorClasses[
          color
        ]}"
      />
    </FlexGroup>
  </Card>
</a>
