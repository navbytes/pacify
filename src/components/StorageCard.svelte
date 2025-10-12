<script lang="ts">
  import type { ComponentType } from 'svelte'
  import Card from './Card.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import IconBadge from './IconBadge.svelte'
  import ProgressBar from './ProgressBar.svelte'
  import Text from './Text.svelte'

  type BadgeColor = 'blue' | 'green' | 'purple' | 'orange'

  interface Props {
    title: string
    icon: ComponentType
    used: number
    quota: number
    usedLabel: string
    quotaLabel: string
    color?: BadgeColor
  }

  let { title, icon, used, quota, usedLabel, quotaLabel, color = 'blue' }: Props = $props()
</script>

<Card
  classes="hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
>
  <div class="space-y-3">
    <FlexGroup childrenGap="sm" alignItems="center">
      <IconBadge {icon} {color} size="sm" />
      <Text weight="medium">{title}</Text>
    </FlexGroup>
    <div class="space-y-2">
      <FlexGroup justifyContent="between" alignItems="center">
        <Text size="sm" color="muted">Usage</Text>
        <Text size="sm" weight="medium">
          {usedLabel} / {quotaLabel}
        </Text>
      </FlexGroup>
      <ProgressBar value={used} max={quota} size="md" showPercentage={true} />
    </div>
  </div>
</Card>
