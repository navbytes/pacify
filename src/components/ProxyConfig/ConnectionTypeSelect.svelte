<script lang="ts">
import type { ComponentType } from 'svelte'
import type { ProxyMode } from '@/interfaces'
import { I18nService } from '@/services/i18n/i18nService'
import { cn } from '@/utils/cn'
import { Check, GitBranch, Globe, Monitor, Radar, Server, Settings } from '@/utils/icons'

interface Props {
  value?: ProxyMode
  onchange?: (mode: ProxyMode) => void
  // When provided, a "Route by site" choice appears that hands off to the
  // rule-based routing editor (item 10) instead of selecting a chrome.proxy mode.
  onRouteBySite?: () => void
}

let { value = $bindable('fixed_servers'), onchange, onRouteBySite }: Props = $props()

interface MenuItem {
  key: string
  label: string
  desc: string
  sub?: string
  icon: ComponentType
  mode?: ProxyMode
  route?: boolean
}

// De-jargoned "what kind of proxy" choices. Plain-language labels with the real
// term as a sub-label so migrators who know "PAC"/"WPAD" still recognize it.
// "Connect through a server" leads (the 80% case + default); "Route by site"
// sits second and hands off to the routing editor.
let items = $derived<MenuItem[]>([
  {
    key: 'fixed_servers',
    mode: 'fixed_servers',
    label: I18nService.getMessage('connTypeServer'),
    desc: I18nService.getMessage('connTypeServerDesc'),
    icon: Server,
  },
  ...(onRouteBySite
    ? [
        {
          key: 'route_by_site',
          route: true,
          label: I18nService.getMessage('connTypeRouting'),
          desc: I18nService.getMessage('connTypeRoutingDesc'),
          sub: 'rules / PAC',
          icon: GitBranch,
        } as MenuItem,
      ]
    : []),
  {
    key: 'system',
    mode: 'system',
    label: I18nService.getMessage('connTypeSystem'),
    desc: I18nService.getMessage('connTypeSystemDesc'),
    sub: 'system',
    icon: Monitor,
  },
  {
    key: 'direct',
    mode: 'direct',
    label: I18nService.getMessage('connTypeDirect'),
    desc: I18nService.getMessage('connTypeDirectDesc'),
    icon: Globe,
  },
  {
    key: 'auto_detect',
    mode: 'auto_detect',
    label: I18nService.getMessage('connTypeAutoDetect'),
    desc: I18nService.getMessage('connTypeAutoDetectDesc'),
    sub: 'WPAD',
    icon: Radar,
  },
  {
    key: 'pac_script',
    mode: 'pac_script',
    label: I18nService.getMessage('connTypePac'),
    desc: I18nService.getMessage('connTypePacDesc'),
    sub: 'PAC',
    icon: Settings,
  },
])

let open = $state(false)
let selected = $derived(items.find((o) => o.mode === value) ?? items[0])

function pick(item: MenuItem) {
  open = false
  if (item.route) {
    onRouteBySite?.()
  } else if (item.mode && item.mode !== value) {
    value = item.mode
    onchange?.(item.mode)
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
  const opts = Array.from(menu.querySelectorAll<HTMLElement>('[role="option"]'))
  const i = opts.indexOf(document.activeElement as HTMLElement)
  if (event.key === 'Escape') {
    open = false
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    opts[Math.min(i + 1, opts.length - 1)]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    opts[Math.max(i - 1, 0)]?.focus()
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
        <span class="block text-xs text-slate-600 dark:text-slate-400 truncate">
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
      {#each items as item (item.key)}
        {@const isSel = !item.route && item.mode === value}
        <button
          type="button"
          role="option"
          aria-selected={isSel}
          tabindex="0"
          data-testid="segment-{item.key}"
          onclick={() => pick(item)}
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
            <item.icon size={16} />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {item.label}
              </span>
              {#if item.sub}
                <span class="text-[11px] text-slate-500 dark:text-slate-500">· {item.sub}</span>
              {/if}
            </span>
            <span class="block text-xs text-slate-600 dark:text-slate-400">{item.desc}</span>
          </span>
          {#if isSel}
            <Check size={16} class="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          {:else if item.route}
            <span class="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600" aria-hidden="true"
              >→</span
            >
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
