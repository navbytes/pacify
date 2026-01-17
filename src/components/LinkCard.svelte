<script lang="ts">
import type { ComponentType } from 'svelte'
import {
  linkCardExternalIconVariants,
  linkCardIconBadgeVariants,
  linkCardLabelVariants,
} from '@/utils/classPatterns'
import { ExternalLink } from '@/utils/icons'
import FlexGroup from './FlexGroup.svelte'
import IconBadge from './IconBadge.svelte'

interface Props {
  href: string
  icon: ComponentType
  label: string
  color?: 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange' | 'pink'
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

const gradientMap = {
  blue: 'from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20',
  red: 'from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20',
  yellow: 'from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/20',
  green: 'from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20',
  purple: 'from-purple-50/50 to-violet-50/50 dark:from-purple-950/20 dark:to-violet-950/20',
  orange: 'from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20',
  pink: 'from-pink-50/50 to-rose-50/50 dark:from-pink-950/20 dark:to-rose-950/20',
}
</script>

<a {href} {target} {rel} class="group block">
  <div
    class="relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
  >
    <!-- Subtle gradient overlay on hover -->
    <div
      class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br {gradientMap[
        color
      ]}"
    ></div>

    <div class="relative p-4">
      <FlexGroup childrenGap="sm" alignItems="center">
        <IconBadge {icon} {color} size="md" classes={linkCardIconBadgeVariants({ color })} />
        <div class="flex-1 min-w-0">
          <div class={linkCardLabelVariants()}>{label}</div>
        </div>
        <ExternalLink size={16} class={linkCardExternalIconVariants({ color })} />
      </FlexGroup>
    </div>
  </div>
</a>
