<script lang="ts">
import { I18nService } from '@/services/i18n/i18nService'
import { checkboxLabelVariants, formLabelVariants, inputVariants } from '@/utils/classPatterns'
import { cn } from '@/utils/cn'
import FlexGroup from '../FlexGroup.svelte'
import Text from '../Text.svelte'
import ProxyInput from './ProxyInput.svelte'

interface ProxyServerSettings {
  scheme?: string
  host?: string
  port?: string
}

interface ProxySettings {
  singleProxy?: ProxyServerSettings
  proxyForHttp?: ProxyServerSettings
  proxyForHttps?: ProxyServerSettings
  proxyForFtp?: ProxyServerSettings
  fallbackProxy?: ProxyServerSettings
  bypassList?: string[]
}

interface Props {
  useSharedProxy?: boolean
  proxySettings: ProxySettings
  bypassListContent?: string
}

let {
  useSharedProxy = $bindable(true),
  proxySettings = $bindable(),
  bypassListContent = $bindable(''),
}: Props = $props()

// Map for individual proxies with proper typing
const proxyTypeMap = {
  HTTP: 'proxyForHttp',
  HTTPS: 'proxyForHttps',
  FTP: 'proxyForFtp',
  Fallback: 'fallbackProxy',
} as const

type ProxyType = keyof typeof proxyTypeMap

const proxyLocalizedNames: Record<ProxyType, string> = {
  HTTP: I18nService.getMessage('httpProxy'),
  HTTPS: I18nService.getMessage('httpsProxy'),
  FTP: I18nService.getMessage('ftpProxy'),
  Fallback: I18nService.getMessage('fallbackProxy'),
}

const checkboxStyles = checkboxLabelVariants()
</script>

<div class="space-y-4">
  <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
    <input
      type="checkbox"
      id="useSharedProxy"
      bind:checked={useSharedProxy}
      class={checkboxStyles.checkbox}
    >
    <label for="useSharedProxy" class={checkboxStyles.label}>
      {I18nService.getMessage('useSameProxy')}
    </label>
  </FlexGroup>

  {#if useSharedProxy}
    <!-- Single Proxy Configuration -->
    <div class="space-y-4">
      <h3 class={formLabelVariants({ spacing: 'none' })}>
        {I18nService.getMessage('proxyServer')}
      </h3>
      {#if proxySettings.singleProxy}
        <ProxyInput
          bind:scheme={proxySettings.singleProxy.scheme}
          bind:host={proxySettings.singleProxy.host}
          bind:port={proxySettings.singleProxy.port}
          testIdPrefix="single-proxy"
        />
      {/if}
    </div>
  {:else}
    <!-- Individual Proxy Configurations -->
    {#each Object.keys(proxyTypeMap) as proxyType}
      {@const proxyKey = proxyTypeMap[proxyType as ProxyType]}
      {@const proxy = proxySettings[proxyKey as keyof ProxySettings]}
      <div class="space-y-4">
        <h3 class={formLabelVariants({ spacing: 'none' })}>
          {proxyLocalizedNames[proxyType as ProxyType]}
        </h3>
        {#if proxy && typeof proxy !== 'string' && !Array.isArray(proxy)}
          <ProxyInput
            bind:scheme={proxy.scheme}
            bind:host={proxy.host}
            bind:port={proxy.port}
            testIdPrefix={proxyType.toLowerCase()}
          />
        {/if}
      </div>
    {/each}
  {/if}

  <!-- Bypass List -->
  <div>
    <label for="bypassList" class={formLabelVariants()}>
      {I18nService.getMessage('bypassList')}
    </label>
    <textarea
      id="bypassList"
      bind:value={bypassListContent}
      rows="4"
      class={cn(inputVariants({ state: 'default', size: 'md' }), 'font-mono text-sm')}
      placeholder={I18nService.getMessage('bypassListPlaceholder') ||
        '*.example.com\n192.168.1.0/24\nlocalhost'}
    ></textarea>
    <Text as="p" size="xs" classes="mt-1 text-slate-500 dark:text-slate-400">
      {I18nService.getMessage('bypassListHelp') ||
        'Enter one address per line. Supports wildcards (*), CIDR notation, and exact matches.'}
    </Text>
  </div>
</div>
