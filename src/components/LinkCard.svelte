<script lang="ts">
import type { ComponentType } from 'svelte'
import { linkCardExternalIconVariants, linkCardIconBadgeVariants } from '@/utils/classPatterns'
import { ExternalLink } from '@/utils/icons'
import Card from './Card.svelte'
import FlexGroup from './FlexGroup.svelte'
import IconBadge from './IconBadge.svelte'

interface Props {
  href: string
  icon: ComponentType
  label: string
  color?: 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange'
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
</script>

<a {href} {target} {rel} class="group block">
  <Card
    classes="p-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
  >
    <FlexGroup childrenGap="sm" alignItems="center">
      <IconBadge {icon} {color} size="md" classes={linkCardIconBadgeVariants({ color })} />
      <div class="flex-1 min-w-0">
        <div
          class="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
        >
          {label}
        </div>
      </div>
      <ExternalLink size={16} class={linkCardExternalIconVariants({ color })} />
    </FlexGroup>
  </Card>
</a>
