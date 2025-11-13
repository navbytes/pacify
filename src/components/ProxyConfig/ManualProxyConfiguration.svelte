<script lang="ts">
  import ProxyInput from './ProxyInput.svelte'
  import FlexGroup from '../FlexGroup.svelte'
  import { I18nService } from '@/services/i18n/i18nService'

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
</script>

<div class="space-y-6">
  <FlexGroup direction="horizontal" childrenGap="sm" alignItems="center">
    <input
      type="checkbox"
      id="useSharedProxy"
      bind:checked={useSharedProxy}
      class="rounded border-slate-300 text-primary focus:ring-primary"
    />
    <label for="useSharedProxy" class="text-sm text-slate-700 dark:text-slate-300">
      {I18nService.getMessage('useSameProxy')}
    </label>
  </FlexGroup>

  {#if useSharedProxy}
    <!-- Single Proxy Configuration -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
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
        <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {proxyLocalizedNames[proxyType as ProxyType]}
        </h3>
        {#if proxy}
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
    <label
      for="bypassList"
      class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
    >
      {I18nService.getMessage('bypassList')}
    </label>
    <textarea
      id="bypassList"
      bind:value={bypassListContent}
      rows="4"
      class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md
             bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
      placeholder={I18nService.getMessage('bypassListPlaceholder')}
    ></textarea>
  </div>
</div>
