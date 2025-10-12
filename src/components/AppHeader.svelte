<script lang="ts">
  import Card from './Card.svelte'
  import FlexGroup from './FlexGroup.svelte'
  import Text from './Text.svelte'

  interface Props {
    appName: string
    version: string
    description: string
  }

  let { appName, version, description }: Props = $props()
</script>

<Card
  classes="border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-200"
>
  <div class="flex-1 space-y-3">
    <FlexGroup childrenGap="sm" alignItems="baseline">
      <Text size="2xl" weight="bold">{appName}</Text>
      <span
        class="px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full ring-1 ring-blue-200 dark:ring-blue-800"
      >
        v{version}
      </span>
    </FlexGroup>
    <Text as="p" size="sm" color="muted" classes="max-w-2xl leading-relaxed">
      {description}
    </Text>
  </div>
</Card>
