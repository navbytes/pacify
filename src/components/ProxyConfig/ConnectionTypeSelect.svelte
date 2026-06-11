<script lang="ts">
import type { ComponentType } from 'svelte'
import type { ProxyMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { cn } from '@/utils/cn'
import { Check, Globe, Monitor, Radar, Server, Settings } from '@/utils/icons'

interface Props {
  value?: ProxyMode
  onchange?: (mode: ProxyMode) => void
}

let { value = $bindable('fixed_servers'), onchange }: Props = $props()

interface Option {
  value: ProxyMode
  label: string
  desc: string
  sub?: string
  icon: ComponentType
}

// De-jargoned "what kind of proxy" choices. Plain-language labels with the real
// term as a sub-label so migrators who know "PAC"/"WPAD" still recognize it.
// "Connect through a server" leads — it's the 80% case and the default.
const options: Option[] = [
  {
    value: 'fixed_servers',
    label: I18nService.getMessage('connTypeServer'),
    desc: I18nService.getMessage('connTypeServerDesc'),
    icon: Server,
  },
  {
    value: 'system',
    label: I18nService.getMessage('connTypeSystem'),
    desc: I18nService.getMessage('connTypeSystemDesc'),
    sub: 'system',
    icon: Monitor,
  },
  {
    value: 'direct',
    label: I18nService.getMessage('connTypeDirect'),
    desc: I18nService.getMessage('connTypeDirectDesc'),
    icon: Globe,
  },
  {
    value: 'auto_detect',
    label: I18nService.getMessage('connTypeAutoDetect'),
    desc: I18nService.getMessage('connTypeAutoDetectDesc'),
    sub: 'WPAD',
    icon: Radar,
  },
  {
    value: 'pac_script',
    label: I18nService.getMessage('connTypePac'),
    desc: I18nService.getMessage('connTypePacDesc'),
    sub: 'PAC',
    icon: Settings,
  },
]

let open = $state(false)
let selected = $derived(options.find((o) => o.value === value) ?? options[0])

function choose(mode: ProxyMode) {
  open = false
  if (mode !== value) {
    value = mode
    onchange?.(mode)
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    open = true
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const menu = event.currentTarget as HTMLElement
  const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="option"]'))
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (event.key === 'Escape') {
    open = false
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    items[Math.min(i + 1, items.length - 1)]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    items[Math.max(i - 1, 0)]?.focus()
  }
}
</script>

<svelte:window
  onclick={(e) => {
    if (open && !(e.target as HTMLElement)?.closest('[data-conn-type]')) open = false
  }}
/>

<div class="relative" data-conn-type>
  <button
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    data-testid="conn-type-trigger"
    onclick={() => (open = !open)}
    onkeydown={onTriggerKeydown}
    class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-left transition hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  >
    <span class="flex items-center gap-2.5 min-w-0">
      <span
        class="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center"
      >
        <selected.icon size={16} />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {selected.label}
        </span>
        <span class="block text-xs text-slate-500 dark:text-slate-400 truncate">
          {selected.desc}
        </span>
      </span>
    </span>
    <span
      class="shrink-0 text-slate-400 transition-transform {open ? 'rotate-180' : ''}"
      aria-hidden="true"
      >▾</span
    >
  </button>

  {#if open}
    <!-- biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled via roving option focus -->
    <div
      role="listbox"
      aria-label={I18nService.getMessage('connectionType')}
      tabindex="-1"
      onkeydown={onMenuKeydown}
      class="absolute z-30 mt-1.5 w-full max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl"
    >
      {#each options as option (option.value)}
        {@const isSel = option.value === value}
        <button
          type="button"
          role="option"
          aria-selected={isSel}
          tabindex="0"
          data-testid="segment-{option.value}"
          onclick={() => choose(option.value)}
          class={cn(
            'w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition focus:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-blue-950/30',
            isSel ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
          )}
        >
          <span
            class={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              isSel
                ? 'bg-linear-to-br from-blue-500 to-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
            )}
          >
            <option.icon size={16} />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {option.label}
              </span>
              {#if option.sub}
                <span class="text-[11px] text-slate-400 dark:text-slate-500">· {option.sub}</span>
              {/if}
            </span>
            <span class="block text-xs text-slate-500 dark:text-slate-400">{option.desc}</span>
          </span>
          {#if isSel}
            <Check size={16} class="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
