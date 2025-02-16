<script lang="ts">
  import { Server } from 'lucide-svelte'
  import Button from '../Button.svelte'
  import FlexGroup from '../FlexGroup.svelte'

  export let proxyMode: string = 'system'

  const options = [
    { value: 'system', label: 'System' },
    { value: 'direct', label: 'Direct' },
    { value: 'auto_detect', label: 'Auto‑config URL' },
    { value: 'pac_script', label: 'PAC Script' },
    { value: 'fixed_servers', label: 'Manual Configuration' },
  ]

  function selectOption(value: string) {
    proxyMode = value
  }
</script>

<div>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="start"
    classes="mb-1"
  >
    <Server size={20} />
    Proxy Mode <span class="text-red-500">*</span>
  </FlexGroup>
  <FlexGroup
    direction="horizontal"
    childrenGap="sm"
    alignItems="center"
    justifyContent="between"
    classes="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl"
  >
    {#each options as option}
      <Button
        type="button"
        classes="flex-grow"
        on:click={() => selectOption(option.value)}
        color={proxyMode === option.value ? 'primary' : 'secondary'}
      >
        {option.label}
      </Button>
    {/each}
  </FlexGroup>
</div>
