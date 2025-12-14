<script lang="ts">
  import { Keyboard, ChevronDown, ChevronUp } from 'lucide-svelte'
  import Card from '@/components/Card.svelte'
  import Text from '@/components/Text.svelte'

  let showKeyboardHints = $state(false)

  const shortcuts = [
    { label: 'Focus search', keys: 'Ctrl/Cmd+K' },
    { label: 'New proxy', keys: 'Ctrl/Cmd+N' },
    { label: 'Clear search', keys: 'Escape' },
    { label: 'Toggle proxy 1-9', keys: '1-9' },
  ]
</script>

<Card classes="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
  <button
    type="button"
    onclick={() => (showKeyboardHints = !showKeyboardHints)}
    class="w-full flex items-center justify-between text-left"
  >
    <div class="flex items-center gap-2">
      <Keyboard size={18} class="text-blue-600 dark:text-blue-400" />
      <Text weight="semibold" classes="text-blue-900 dark:text-blue-100">Keyboard Shortcuts</Text>
    </div>
    {#if showKeyboardHints}
      <ChevronUp size={18} class="text-blue-600 dark:text-blue-400" />
    {:else}
      <ChevronDown size={18} class="text-blue-600 dark:text-blue-400" />
    {/if}
  </button>

  {#if showKeyboardHints}
    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each shortcuts as { label, keys }}
        <div class="flex items-center justify-between py-1.5">
          <Text size="sm" color="muted">{label}</Text>
          <kbd
            class="px-2 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded shadow-sm"
          >
            {keys}
          </kbd>
        </div>
      {/each}
    </div>
  {/if}
</Card>
