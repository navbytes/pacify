<script lang="ts">
import { Network, Server, Zap } from 'lucide-svelte'
import type { AutoProxyRouteType, ProxyConfig, ProxyServer } from '@/interfaces/settings'
import { I18nService } from '@/services/i18n/i18nService'
import { inputVariants } from '@/utils/classPatterns'
import { sectionInnerContentVariants } from '@/utils/classPatterns/autoProxy'
import FlexGroup from '../FlexGroup.svelte'
import SegmentedControl from '../SegmentedControl.svelte'
import Text from '../Text.svelte'

interface Props {
  proxyType: AutoProxyRouteType
  proxyId?: string
  inlineProxy?: ProxyServer
  availableProxies: ProxyConfig[]
  onchange: (proxyType: AutoProxyRouteType, proxyId?: string, inlineProxy?: ProxyServer) => void
}

let {
  proxyType,
  proxyId = undefined,
  inlineProxy = undefined,
  availableProxies,
  onchange,
}: Props = $props()

// Filter out Auto-Proxy configs from available proxies
let selectableProxies = $derived(availableProxies.filter((p) => p.autoProxy === undefined))

// Local state for inline proxy
let inlineHost = $state(inlineProxy?.host || '')
let inlinePort = $state(inlineProxy?.port || '')
let inlineScheme = $state<ProxyServer['scheme']>(inlineProxy?.scheme || 'http')

// Input styles
const selectClasses = inputVariants({ size: 'md' })
const smallSelectClasses = inputVariants({ size: 'sm' })
const smallInputClasses = inputVariants({ size: 'sm' })

// Segmented control options for proxy type
const proxyTypeOptions: { value: AutoProxyRouteType; label: string; icon: typeof Zap }[] = [
  {
    value: 'direct',
    label: I18nService.getMessage('directConnection'),
    icon: Zap,
  },
  {
    value: 'existing',
    label: I18nService.getMessage('selectProxy'),
    icon: Network,
  },
  {
    value: 'inline',
    label: I18nService.getMessage('defineInline'),
    icon: Server,
  },
]

function handleTypeChange(newType: string) {
  const type = newType as AutoProxyRouteType

  if (type === 'direct') {
    onchange('direct')
  } else if (type === 'existing') {
    onchange('existing', selectableProxies[0]?.id)
  } else if (type === 'inline') {
    onchange('inline', undefined, { scheme: 'http', host: '', port: '' })
  }
}

function handleProxySelect(event: Event) {
  const target = event.target as HTMLSelectElement
  onchange('existing', target.value)
}

function handleInlineChange() {
  onchange('inline', undefined, {
    scheme: inlineScheme,
    host: inlineHost,
    port: inlinePort,
  })
}
</script>

<div class="space-y-4">
  <!-- Proxy Type Selector using SegmentedControl -->
  <div>
    <Text size="sm" weight="medium" classes="block text-slate-700 dark:text-slate-300 mb-2">
      {I18nService.getMessage('proxyType')}
    </Text>
    <SegmentedControl
      options={proxyTypeOptions}
      value={proxyType}
      onchange={handleTypeChange}
      size="sm"
      fullWidth
      aria-label={I18nService.getMessage('proxyType')}
    />
  </div>

  <!-- Existing Proxy Selector -->
  {#if proxyType === 'existing'}
    <div>
      <label
        for="proxy-select"
        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {I18nService.getMessage('selectProxy')}
      </label>
      {#if selectableProxies.length > 0}
        <select
          id="proxy-select"
          value={proxyId}
          onchange={handleProxySelect}
          class={selectClasses}
        >
          {#each selectableProxies as proxy (proxy.id)}
            <option value={proxy.id}>
              {proxy.name}
              {#if proxy.rules?.singleProxy}
                ({proxy.rules.singleProxy.host}:{proxy.rules.singleProxy.port})
              {:else if proxy.mode === 'pac_script'}
                {I18nService.getMessage('proxyModePacScript')}
              {:else if proxy.mode === 'system'}
                {I18nService.getMessage('proxyModeSystem')}
              {:else if proxy.mode === 'direct'}
                {I18nService.getMessage('proxyModeDirect')}
              {:else if proxy.mode === 'auto_detect'}
                {I18nService.getMessage('proxyModeAutoDetect')}
              {/if}
            </option>
          {/each}
        </select>
      {:else}
        <Text size="sm" color="muted">{I18nService.getMessage('noProxiesAvailable')}</Text>
      {/if}
    </div>
  {/if}

  <!-- Inline Proxy Definition -->
  {#if proxyType === 'inline'}
    <div class={sectionInnerContentVariants({ color: 'slate' })}>
      <FlexGroup direction="horizontal" childrenGap="sm">
        <div class="w-24">
          <label
            for="inline-scheme"
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            {I18nService.getMessage('scheme')}
          </label>
          <select
            id="inline-scheme"
            bind:value={inlineScheme}
            onchange={handleInlineChange}
            class={smallSelectClasses}
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="socks4">SOCKS4</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>
        <div class="flex-1">
          <label
            for="inline-host"
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            {I18nService.getMessage('host')}
          </label>
          <input
            id="inline-host"
            type="text"
            bind:value={inlineHost}
            onchange={handleInlineChange}
            placeholder="proxy.example.com"
            class={smallInputClasses}
          >
        </div>
        <div class="w-20">
          <label
            for="inline-port"
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
          >
            {I18nService.getMessage('port')}
          </label>
          <input
            id="inline-port"
            type="text"
            bind:value={inlinePort}
            onchange={handleInlineChange}
            placeholder="8080"
            class={smallInputClasses}
          >
        </div>
      </FlexGroup>
    </div>
  {/if}
</div>
